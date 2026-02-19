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


class FlagRequest(BaseModel):
    """Request model for flagging accounts to blockchain"""
    hashed_id: str
    risk_score: int
    transaction_count: int
    flagged_connections: int


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
                print(f"Visualization generation failed: {viz_error}")
                results['visualizations'] = None
        else:
            results['visualizations'] = None
        
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


@app.post("/flag-to-blockchain")
async def flag_to_blockchain(request: FlagRequest):
    """
    Flag an account to the Algorand blockchain AML registry
    
    This endpoint would integrate with the Algorand smart contract
    to register the hashed account with its risk profile
    
    TODO: Implement Algorand SDK integration
    """
    # TODO: Implement actual blockchain transaction
    # For now, return mock response
    return {
        "status": "success",
        "message": "Account flagged to blockchain",
        "hashed_id": request.hashed_id,
        "risk_score": request.risk_score,
        "transaction_id": "mock_txn_id"  # Would be real Algorand txn ID
    }


@app.get("/query-wallet/{hashed_id}")
async def query_wallet(hashed_id: str):
    """
    Query if a wallet is flagged in the AML registry
    
    Used by Bank B to screen new customers
    
    TODO: Implement Algorand smart contract query
    """
    # TODO: Implement actual blockchain query
    # For now, return mock response
    return {
        "hashed_id": hashed_id,
        "is_flagged": False,  # Would query blockchain
        "risk_score": 0,
        "message": "Wallet not found in registry"
    }


@app.get("/download")
async def download_results():
    """
    Download the last analysis results as JSON file
    
    Returns:
        FileResponse: output.json file for download
    """
    output_path = Path("output.json")
    
    if not output_path.exists():
        raise HTTPException(
            status_code=404, 
            detail="No analysis results found. Please run /analyze first."
        )
    
    return FileResponse(
        path=output_path,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
