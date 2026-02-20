"""
Deploy AML Registry Smart Contract to Algorand TestNet
"""
import json
import os
import base64
from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction

# TestNet configuration
ALGOD_SERVER = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Account details
MNEMONIC = "veteran seminar eyebrow birth weather turkey immune evolve nerve fiber excite enough glimpse ancient useful system ivory inject turtle demand pistol improve trophy absent hood"

def deploy():
    # Connect to TestNet
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)
    
    # Get account from mnemonic
    sk = mnemonic.to_private_key(MNEMONIC)
    addr = account.address_from_private_key(sk)
    print(f"Deployer address: {addr}")
    
    # Check balance
    info = client.account_info(addr)
    balance = info['amount'] / 1_000_000
    print(f"Balance: {balance} ALGO")
    
    if balance < 1:
        print("❌ Insufficient balance. Please fund the account first.")
        return
    
    # Load compiled TEAL from artifacts
    artifacts_dir = os.path.join(
        os.path.dirname(__file__),
        "..",
        "projects",
        "aml-registry-contracts",
        "smart_contracts",
        "artifacts",
        "aml_registry"
    )
    
    # Check for approval and clear TEAL files
    approval_path = os.path.join(artifacts_dir, "AmlRegistry.approval.teal")
    clear_path = os.path.join(artifacts_dir, "AmlRegistry.clear.teal")
    
    if not os.path.exists(approval_path):
        print(f"❌ Approval TEAL not found at: {approval_path}")
        print("Available files:", os.listdir(artifacts_dir) if os.path.exists(artifacts_dir) else "Directory not found")
        return
    
    print(f"📄 Loading TEAL from: {artifacts_dir}")
    
    # Read TEAL source
    with open(approval_path, 'r') as f:
        approval_teal = f.read()
    with open(clear_path, 'r') as f:
        clear_teal = f.read()
    
    # Compile TEAL to bytecode
    print("🔨 Compiling approval program...")
    approval_result = client.compile(approval_teal)
    approval_program = base64.b64decode(approval_result['result'])
    
    print("🔨 Compiling clear program...")
    clear_result = client.compile(clear_teal)
    clear_program = base64.b64decode(clear_result['result'])
    
    print(f"✅ Compiled: approval={len(approval_program)} bytes, clear={len(clear_program)} bytes")
    
    # Get suggested params
    sp = client.suggested_params()
    
    # Create application
    # Global schema: 0 ints, 0 bytes (we use box storage)
    # Local schema: 0 ints, 0 bytes
    global_schema = transaction.StateSchema(0, 0)
    local_schema = transaction.StateSchema(0, 0)
    
    txn = transaction.ApplicationCreateTxn(
        sender=addr,
        sp=sp,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )
    
    # Sign and send
    print("📤 Deploying to TestNet...")
    signed_txn = txn.sign(sk)
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction ID: {tx_id}")
    
    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    result = transaction.wait_for_confirmation(client, tx_id, 4)
    
    app_id = result['application-index']
    app_addr = transaction.logic.get_application_address(app_id)
    
    print(f"\n🎉 Contract deployed to TestNet!")
    print(f"  App ID: {app_id}")
    print(f"  App Address: {app_addr}")
    print(f"  Transaction: {tx_id}")
    print(f"  Explorer: https://lora.algokit.io/testnet/application/{app_id}")
    
    # Fund the app account for box storage MBR
    print(f"\n💰 Funding app account with 1 ALGO for box storage MBR...")
    sp = client.suggested_params()
    pay_txn = transaction.PaymentTxn(
        sender=addr,
        sp=sp,
        receiver=app_addr,
        amt=1_000_000  # 1 ALGO
    )
    signed_pay = pay_txn.sign(sk)
    pay_tx_id = client.send_transaction(signed_pay)
    transaction.wait_for_confirmation(client, pay_tx_id, 4)
    print(f"  ✅ Funded app with 1 ALGO (txid: {pay_tx_id})")
    
    print(f"\n📋 Add these to your .env file:")
    print(f"  ALGOD_SERVER=https://testnet-api.algonode.cloud")
    print(f"  ALGOD_TOKEN=")
    print(f"  APP_ID={app_id}")
    print(f"  NETWORK=testnet")
    
    return app_id

if __name__ == "__main__":
    deploy()
