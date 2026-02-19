from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import hashlib
import json
from pathlib import Path
from graph_analyzer import analyze_transactions
from typing import Optional
import networkx as nx
import os
import secrets
from dotenv import load_dotenv
from algosdk.v2client import algod
from algosdk.kmd import KMDClient
from algosdk import mnemonic, account, transaction
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer, 
    TransactionWithSigner,
    AccountTransactionSigner
)
from algosdk.abi import Contract, Method

# IPFS Client
try:
    import ipfshttpclient
    IPFS_AVAILABLE = True
    # Connect to local IPFS node (default: http://127.0.0.1:5001)
    try:
        ipfs_client = ipfshttpclient.connect('/ip4/127.0.0.1/tcp/5001')
        print("✅ Connected to IPFS node")
    except Exception as e:
        print(f"⚠️ IPFS node not available: {e}")
        print("   Run: ipfs daemon")
        ipfs_client = None
        IPFS_AVAILABLE = False
except ImportError:
    print("⚠️ IPFS client not installed. Run: pip install ipfshttpclient")
    ipfs_client = None
    IPFS_AVAILABLE = False

# Load environment variables
load_dotenv()
ALGOD_SERVER = os.getenv("ALGOD_SERVER", "http://localhost:4001")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
APP_ID = int(os.getenv("APP_ID", "1002"))
CREATOR_MNEMONIC = os.getenv("CREATOR_MNEMONIC", "")

# Helper: get algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)

# Helper: get account from LocalNet KMD (default funded account)
def get_localnet_default_account():
    """Get the first funded account from LocalNet KMD wallet"""
    try:
        kmd_client = KMDClient(
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "http://localhost:4002"
        )
        wallets = kmd_client.list_wallets()
        wallet_id = None
        for wallet in wallets:
            if wallet["name"] == "unencrypted-default-wallet":
                wallet_id = wallet["id"]
                break
        
        if wallet_id:
            wallet_handle = kmd_client.init_wallet_handle(wallet_id, "")
            addresses = kmd_client.list_keys(wallet_handle)
            if addresses:
                # Get first account
                addr = addresses[0]
                private_key = kmd_client.export_key(wallet_handle, "", addr)
                return private_key, addr
    except Exception as e:
        print(f"Warning: Could not access LocalNet KMD: {e}")
        return None, None

# Get sender account (try KMD first, then mnemonic)
sender_sk = None
sender_addr = None

# Try LocalNet KMD first
sender_sk, sender_addr = get_localnet_default_account()

# Fallback to mnemonic if KMD fails
if not sender_sk and CREATOR_MNEMONIC:
    try:
        sender_sk = mnemonic.to_private_key(CREATOR_MNEMONIC)
        sender_addr = account.address_from_private_key(sender_sk)
    except Exception as e:
        print(f"Warning: Could not use mnemonic: {e}")

# Load contract ABI (ARC-56 format)
CONTRACT_JSON_PATH = os.path.join(
    os.path.dirname(__file__), 
    "..", 
    "projects", 
    "aml-registry-contracts", 
    "smart_contracts",
    "artifacts", 
    "aml_registry", 
    "AmlRegistry.arc56.json"
)
contract = None
if os.path.exists(CONTRACT_JSON_PATH):
    with open(CONTRACT_JSON_PATH) as f:
        contract = Contract.from_json(f.read())
else:
    print(f"Warning: Contract ABI not found at {CONTRACT_JSON_PATH}")

# Try to import visualization (requires matplotlib)
try:
    from graph_visualizer import generate_all_visualizations
    VISUALIZATION_AVAILABLE = True
except ImportError:
    VISUALIZATION_AVAILABLE = False
    print("Warning: matplotlib not installed. Graph visualizations disabled.")
    print("Install with: pip install matplotlib==3.9.0")

# Global variables to store last analysis result and graph
last_analysis_result = None
last_graph = None

app = FastAPI(
    title="AML Registry Backend",
    description="Anti-Money Laundering transaction analysis and blockchain integration",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React port
        "https://*.vercel.app",   # Vercel deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HashRequest(BaseModel):
    """Request model for hashing customer identity"""
    customer_id: str
    name: Optional[str] = None
    ssn: Optional[str] = None


class KYCRequest(BaseModel):
    """Request model for KYC verification with PAN"""
    pan_number: str
    customer_name: Optional[str] = None


class FlagRequest(BaseModel):
    """Request model for flagging accounts to blockchain"""
    hashed_id: str
    risk_score: int
    transaction_count: int
    flagged_connections: int
    ipfs_hash: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AML Registry Backend",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "graph_analysis": "operational",
            "blockchain": "operational"
        }
    }


@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Analyze uploaded transaction CSV for money mule patterns
    
    Returns:
        - suspicious_accounts: List of flagged account objects
        - fraud_rings: Detected fraud rings with IDs
        - summary: Statistics and processing time
    """
    global last_analysis_result, last_graph
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        results, graph = analyze_transactions(contents)
        
        # Save to global variables
        last_analysis_result = results
        last_graph = graph
        
        # Generate visualizations (if matplotlib is available)
        if VISUALIZATION_AVAILABLE:
            try:
                viz_paths = generate_all_visualizations(graph, results)
                results['visualizations'] = viz_paths
            except Exception as viz_error:
                error_msg = f"Visualization generation failed: {str(viz_error)}"
                print(error_msg)
                import traceback
                traceback.print_exc()
                results['visualizations'] = {'error': error_msg}
        else:
            results['visualizations'] = {'error': 'matplotlib not installed'}
        
        # Save to JSON file
        output_path = Path("output.json")
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/hash")
async def hash_identity(request: HashRequest):
    """
    Generate SHA-256 hash of customer identity for privacy-preserving storage
    
    Args:
        customer_id: Primary customer identifier
        name: Optional customer name
        ssn: Optional social security number
    
    Returns:
        hashed_id: SHA-256 hash of the identity
    """
    # Combine all available identity fields
    identity_parts = [request.customer_id]
    if request.name:
        identity_parts.append(request.name)
    if request.ssn:
        identity_parts.append(request.ssn)
    
    identity_string = "|".join(identity_parts)
    hashed = hashlib.sha256(identity_string.encode()).hexdigest()
    
    return {
        "hashed_id": hashed,
        "original_id": request.customer_id  # For reference only
    }


@app.post("/kyc-verify")
async def kyc_verify(request: KYCRequest):
    """
    KYC Verification: Hash + Salt PAN number for privacy-preserving blockchain storage
    
    Process:
    1. Generate random salt (cryptographically secure)
    2. Combine PAN + salt
    3. Hash with SHA-256
    4. Store hashed value on blockchain (can be used as Soul Bound Token identifier)
    
    Args:
        pan_number: PAN (Permanent Account Number) or other identity number
        customer_name: Optional customer name for logging
    
    Returns:
        hashed_pan: Salted + hashed PAN for blockchain storage
        salt: Salt used (store this securely off-chain to re-verify)
    """
    # Generate cryptographically secure random salt (32 bytes = 64 hex chars)
    salt = secrets.token_hex(32)
    
    # Combine PAN + salt
    salted_pan = f"{request.pan_number}|{salt}"
    
    # Hash the salted PAN
    hashed_pan = hashlib.sha256(salted_pan.encode()).hexdigest()
    
    return {
        "status": "success",
        "hashed_pan": hashed_pan,
        "salt": salt,
        "note": "Store salt securely off-chain! You need it to re-verify this PAN later.",
        "customer_name": request.customer_name
    }


@app.post("/flag-to-blockchain")
async def flag_to_blockchain(request: FlagRequest):
    """
    Flag an account to the Algorand blockchain AML registry with IPFS reference
    
    Soul Bound Token: Creates immutable on-chain flag + IPFS pointer to detailed data
    """
    if not contract:
        raise HTTPException(status_code=500, detail="Contract ABI not found. Please compile and deploy the contract.")
    if not sender_sk:
        raise HTTPException(status_code=500, detail="No sender account configured. Set CREATOR_MNEMONIC in .env.")
    
    # Use provided IPFS hash or empty string
    ipfs_hash = request.ipfs_hash if request.ipfs_hash else ""
    
    try:
        atc = AtomicTransactionComposer()
        method: Method = contract.get_method_by_name("register_wallet")
        
        # Prepare arguments
        hashed_id_bytes = bytes.fromhex(request.hashed_id)
        signer = AccountTransactionSigner(sender_sk)
        
        # Get suggested params and modify for box storage
        sp = algod_client.suggested_params()
        # Box storage requires extra fee (2500 + (400 * (box_size_in_bytes)))
        # WalletRiskProfile is 6 UInt64s = 48 bytes
        # IPFS hash box: 32 bytes (key suffix) + ~46 bytes (CID) = ~78 bytes
        profile_box_size = 48
        ipfs_box_size = 32 + len(ipfs_hash)  # key suffix + IPFS CID length
        
        # Fee = base + (2500 + 400*size) for each box
        sp.fee = 1000 + (2500 + 400 * profile_box_size) + (2500 + 400 * ipfs_box_size)
        sp.flat_fee = True
        
        # Box references for both boxes
        ipfs_key_bytes = hashed_id_bytes + b"_ipfs"
        
        atc.add_method_call(
            app_id=APP_ID,
            method=method,
            sender=sender_addr,
            sp=sp,
            signer=signer,
            method_args=[
                hashed_id_bytes,
                request.risk_score,
                request.transaction_count,
                request.flagged_connections,
                ipfs_hash
            ],
            boxes=[(APP_ID, hashed_id_bytes), (APP_ID, ipfs_key_bytes)]  # Both box references
        )
        result = atc.execute(algod_client, 2)
        txid = result.tx_ids[0]
        return {
            "status": "success",
            "message": "Account flagged to blockchain with IPFS reference (Soul Bound Token created)",
            "hashed_id": request.hashed_id,
            "risk_score": request.risk_score,
            "ipfs_hash": ipfs_hash,
            "transaction_id": txid
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Blockchain call failed: {error_details}")
        raise HTTPException(status_code=500, detail=f"Blockchain call failed: {str(e)}")


@app.post("/bulk-flag-suspicious")
async def bulk_flag_suspicious():
    """
    Bulk flag all suspicious accounts from the last analysis to blockchain + IPFS
    
    Process:
    1. Upload complete mule data to IPFS (detailed transaction history, patterns)
    2. Flag each account to blockchain with IPFS hash (Soul Bound Token)
    
    On-chain: Minimal flag + IPFS pointer (immutable)
    Off-chain (IPFS): Full analysis, transaction data, graph info
    """
    global last_analysis_result
    
    if not last_analysis_result:
        raise HTTPException(status_code=404, detail="No analysis results available. Run /analyze first.")
    
    if not contract or not sender_sk:
        raise HTTPException(status_code=500, detail="Blockchain not configured")
    
    suspicious_accounts = last_analysis_result.get("suspicious_accounts", [])
    
    if not suspicious_accounts:
        return {
            "status": "success",
            "message": "No suspicious accounts to flag",
            "flagged_count": 0,
            "failed_count": 0
        }
    
    # Upload mule data to IPFS (off-chain storage)
    ipfs_hash = ""
    if IPFS_AVAILABLE and ipfs_client:
        try:
            # Prepare data for IPFS (only mule-related info, no full transaction graph)
            ipfs_data = {
                "mules_detected": [
                    {
                        "account_id": acc.get("account_id"),
                        "risk_score": acc.get("suspicion_score"),
                        "patterns": acc.get("detected_patterns", []),
                        "transaction_count": acc.get("transaction_count", 0),
                        "flagged_connections": acc.get("flagged_connections", 0),
                    }
                    for acc in suspicious_accounts
                ],
                "fraud_rings": last_analysis_result.get("fraud_rings", []),
                "detection_timestamp": last_analysis_result.get("summary", {}).get("timestamp", ""),
            }
            
            # Upload to IPFS
            result = ipfs_client.add_json(ipfs_data)
            ipfs_hash = result  # This is the CID
            print(f"✅ Uploaded mule data to IPFS: {ipfs_hash}")
        except Exception as e:
            print(f"⚠️  IPFS upload failed: {e}")
            # Continue without IPFS (blockchain flag only)
    
    flagged = []
    failed = []
    
    for account in suspicious_accounts:
        try:
            account_id = account.get("account_id")
            risk_score = int(account.get("suspicion_score", 0))
            
            # Hash the account ID
            hashed_id = hashlib.sha256(account_id.encode()).hexdigest()
            hashed_id_bytes = bytes.fromhex(hashed_id)
            
            # Flag to blockchain with IPFS reference
            atc = AtomicTransactionComposer()
            method: Method = contract.get_method_by_name("register_wallet")
            signer = AccountTransactionSigner(sender_sk)
            
            sp = algod_client.suggested_params()
            profile_box_size = 48
            ipfs_box_size = 32 + len(ipfs_hash)
            sp.fee = 1000 + (2500 + 400 * profile_box_size) + (2500 + 400 * ipfs_box_size)
            sp.flat_fee = True
            
            ipfs_key_bytes = hashed_id_bytes + b"_ipfs"
            
            atc.add_method_call(
                app_id=APP_ID,
                method=method,
                sender=sender_addr,
                sp=sp,
                signer=signer,
                method_args=[
                    hashed_id_bytes,
                    risk_score,
                    account.get("transaction_count", 0),
                    account.get("flagged_connections", 0),
                    ipfs_hash
                ],
                boxes=[(APP_ID, hashed_id_bytes), (APP_ID, ipfs_key_bytes)]
            )
            
            result = atc.execute(algod_client, 2)
            txid = result.tx_ids[0]
            
            flagged.append({
                "account_id": account_id,
                "hashed_id": hashed_id,
                "transaction_id": txid,
                "ipfs_hash": ipfs_hash if ipfs_hash else "N/A"
            })
            
        except Exception as e:
            failed.append({
                "account_id": account.get("account_id"),
                "error": str(e)
            })
    
    return {
        "status": "success",
        "message": f"Flagged {len(flagged)} accounts with Soul Bound Tokens (+ IPFS), {len(failed)} failed",
        "flagged_count": len(flagged),
        "failed_count": len(failed),
        "flagged_accounts": flagged,
        "failed_accounts": failed,
        "ipfs_hash": ipfs_hash if ipfs_hash else "IPFS not available - data only on blockchain"
    }


@app.get("/query-wallet/{hashed_id}")
async def query_wallet(hashed_id: str):
    """
    Query if a wallet is flagged in the AML registry
    
    Used by Bank B to screen new customers
    
    Queries the blockchain for the wallet's risk profile
    """
    if not contract:
        raise HTTPException(status_code=500, detail="Contract ABI not found.")
    
    try:
        # Convert hashed_id to bytes
        hashed_id_bytes = bytes.fromhex(hashed_id)
        
        # Call get_risk_profile method on the smart contract
        atc = AtomicTransactionComposer()
        method: Method = contract.get_method_by_name("get_risk_profile")
        
        # Create a temporary signer for read-only call (no transaction fees for queries)
        if sender_sk:
            signer = AccountTransactionSigner(sender_sk)
            addr = sender_addr
        else:
            raise HTTPException(status_code=500, detail="No account configured for queries")
        
        atc.add_method_call(
            app_id=APP_ID,
            method=method,
            sender=addr,
            sp=algod_client.suggested_params(),
            signer=signer,
            method_args=[hashed_id_bytes],
            boxes=[(APP_ID, hashed_id_bytes)]  # Box reference
        )
        
        result = atc.execute(algod_client, 2)
        
        # Parse the return value (WalletRiskProfile struct)
        # Return format: [risk_score, transaction_count, flagged_connections, last_updated, is_flagged]
        profile = result.abi_results[0].return_value
        
        # Check if profile is None (wallet doesn't exist)
        if profile is None:
            return {
                "hashed_id": hashed_id,
                "is_flagged": False,
                "risk_score": 0,
                "message": "Wallet not found in registry"
            }
        
        return {
            "hashed_id": hashed_id,
            "risk_score": profile[0],
            "transaction_count": profile[1],
            "flagged_connections": profile[2],
            "last_updated": profile[3],
            "is_flagged": bool(profile[4]),
            "message": "Wallet found in registry"
        }
        
    except Exception as e:
        # Wallet not found or other error
        error_msg = str(e)
        if "box not found" in error_msg.lower() or "does not exist" in error_msg.lower():
            return {
                "hashed_id": hashed_id,
                "is_flagged": False,
                "risk_score": 0,
                "message": "Wallet not found in registry"
            }
        else:
            import traceback
            print(f"Query wallet failed: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/download")
async def download_results():
    """
    Download the last analysis results as JSON file (without visualizations field)
    
    Returns:
        FileResponse: output.json file for download
    """
    if last_analysis_result is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis results found. Please run /analyze first."
        )
    
    # Create a copy without visualizations for download
    download_data = {k: v for k, v in last_analysis_result.items() if k != "visualizations"}
    
    # Save to temporary download file
    download_path = Path("download_output.json")
    with open(download_path, 'w') as f:
        json.dump(download_data, f, indent=2)
    
    return FileResponse(
        path=download_path,
        media_type="application/json",
        filename="aml_analysis_output.json"
    )


@app.get("/results")
async def get_latest_results():
    """
    Get the last analysis results without downloading
    
    Returns:
        JSON: Last analysis results
    """
    if last_analysis_result is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis results available. Please run /analyze first."
        )
    
    return last_analysis_result


@app.get("/visualizations/{graph_type}")
async def get_graph_visualization(graph_type: str):
    """
    Get graph visualization images
    
    Args:
        graph_type: One of 'full', 'fraud_rings', 'suspicious'
    
    Returns:
        PNG image file
    """
    if not VISUALIZATION_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Visualization feature requires matplotlib. Install with: pip install matplotlib==3.9.0"
        )
    
    if last_graph is None:
        raise HTTPException(
            status_code=404,
            detail="No graph available. Please run /analyze first."
        )
    
    # Map graph type to file name
    file_mapping = {
        'full': 'graph_full.png',
        'fraud_rings': 'graph_fraud_rings.png',
        'fraud-rings': 'graph_fraud_rings.png',
        'suspicious': 'graph_suspicious.png'
    }
    
    filename = file_mapping.get(graph_type.lower())
    if not filename:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid graph type. Choose from: {', '.join(file_mapping.keys())}"
        )
    
    file_path = Path(filename)
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Graph visualization not found. Please run /analyze first."
        )
    
    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )


@app.get("/graph-stats")
async def get_graph_statistics():
    """
    Get NetworkX graph statistics
    
    Returns:
        Graph metrics and analysis
    """
    if last_graph is None:
        raise HTTPException(
            status_code=404,
            detail="No graph available. Please run /analyze first."
        )
    
    G = last_graph
    
    # Calculate various graph metrics
    stats = {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "density": round(nx.density(G), 4),
        "is_directed": G.is_directed(),
        "average_degree": round(sum(dict(G.degree()).values()) / G.number_of_nodes(), 2) if G.number_of_nodes() > 0 else 0,
    }
    
    # Top connected accounts
    degree_dict = dict(G.degree())
    top_accounts = sorted(degree_dict.items(), key=lambda x: x[1], reverse=True)[:10]
    stats["top_connected_accounts"] = [
        {"account_id": acc, "connections": deg} 
        for acc, deg in top_accounts
    ]
    
    # Check if graph is strongly connected
    if G.is_directed():
        stats["is_strongly_connected"] = nx.is_strongly_connected(G)
        stats["number_of_strongly_connected_components"] = nx.number_strongly_connected_components(G)
    
    return stats


# ==================== SOUL BOUND TOKEN (SBT) ENDPOINTS ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
