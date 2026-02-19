from algopy import ARC4Contract, String, UInt64, Global, Bytes, op
from algopy.arc4 import abimethod, Struct


class WalletRiskProfile(Struct):
    """Risk profile for a wallet address stored on-chain with IPFS reference"""
    risk_score: UInt64  # 0-100 scale
    transaction_count: UInt64
    flagged_connections: UInt64
    last_updated: UInt64  # Timestamp
    is_flagged: UInt64  # 0 = false, 1 = true (using UInt64 for storage)
    ipfs_hash_length: UInt64  # Length of IPFS hash stored separately


class AmlRegistry(ARC4Contract):
    """
    Anti-Money Laundering Registry Smart Contract
    Stores minimal flags on-chain with IPFS references to detailed data
    Privacy-preserving: Uses SHA-256 hashed IDs + stores detailed data on IPFS
    """

    @abimethod
    def register_wallet(
        self,
        hashed_id: Bytes,
        risk_score: UInt64,
        transaction_count: UInt64,
        flagged_connections: UInt64,
        ipfs_hash: String,
    ) -> String:
        """
        Register a new wallet with its risk profile and IPFS pointer
        
        Args:
            hashed_id: SHA-256 hash of the account ID (or salted PAN)
            risk_score: 0-100 risk score
            transaction_count: Number of transactions
            flagged_connections: Number of flagged connections
            ipfs_hash: IPFS hash (CID) pointing to detailed mule data
        
        Blockchain stores: minimal flag + IPFS pointer (Soul Bound - immutable)
        IPFS stores: detailed transaction history, graph data, full analysis
        """
        # Validate risk score is in range
        assert risk_score <= 100, "Risk score must be between 0 and 100"
        
        # Create wallet risk profile
        is_flagged_value = UInt64(1) if risk_score >= 70 else UInt64(0)
        
        profile = WalletRiskProfile(
            risk_score=risk_score,
            transaction_count=transaction_count,
            flagged_connections=flagged_connections,
            last_updated=Global.latest_timestamp,
            is_flagged=is_flagged_value,
            ipfs_hash_length=ipfs_hash.bytes.length,
        )
        
        # Store profile in box storage (key: hashed_id)
        op.Box.put(hashed_id, profile.bytes)
        
        # Store IPFS hash in a separate box (key: hashed_id + "_ipfs")
        ipfs_key = op.concat(hashed_id, Bytes(b"_ipfs"))
        op.Box.put(ipfs_key, ipfs_hash.bytes)
        
        return String("Wallet flagged - Soul Bound Token created with IPFS reference")

    @abimethod
    def update_risk_score(
        self,
        hashed_id: Bytes,
        new_risk_score: UInt64,
    ) -> String:
        """
        Update risk score for an existing wallet
        """
        assert new_risk_score <= 100, "Risk score must be between 0 and 100"
        
        # Retrieve existing profile
        profile_bytes, _exists = op.Box.get(hashed_id)
        profile = WalletRiskProfile.from_bytes(profile_bytes)
        
        # Update risk score and flag status
        profile.risk_score = new_risk_score
        profile.is_flagged = UInt64(1) if new_risk_score >= 70 else UInt64(0)
        profile.last_updated = Global.latest_timestamp
        
        # Save updated profile
        op.Box.put(hashed_id, profile.bytes)
        
        return String("Risk score updated")

    @abimethod
    def get_risk_profile(self, hashed_id: Bytes) -> WalletRiskProfile:
        """
        Retrieve risk profile for a wallet by its hashed ID
        """
        profile_bytes, _exists = op.Box.get(hashed_id)
        return WalletRiskProfile.from_bytes(profile_bytes)
    
    @abimethod
    def get_ipfs_hash(self, hashed_id: Bytes) -> String:
        """
        Retrieve IPFS hash (CID) for detailed mule data
        
        Returns the IPFS hash where full transaction history and analysis are stored
        Frontend can fetch this to display graph visualizations
        """
        ipfs_key = op.concat(hashed_id, Bytes(b"_ipfs"))
        ipfs_hash_bytes, _exists = op.Box.get(ipfs_key)
        return String.from_bytes(ipfs_hash_bytes)

    @abimethod
    def flag_wallet(self, hashed_id: Bytes) -> String:
        """
        Manually flag a wallet for suspicious activity
        """
        profile_bytes, _exists = op.Box.get(hashed_id)
        profile = WalletRiskProfile.from_bytes(profile_bytes)
        
        # Set flag to true
        profile.is_flagged = UInt64(1)
        profile.last_updated = Global.latest_timestamp
        
        # If not already high risk, set to 70 (flagged threshold)
        if profile.risk_score < 70:
            profile.risk_score = UInt64(70)
        
        op.Box.put(hashed_id, profile.bytes)
        
        return String("Wallet flagged for AML review")

    @abimethod
    def is_wallet_flagged(self, hashed_id: Bytes) -> UInt64:
        """
        Check if a wallet is flagged (returns 1 for true, 0 for false)
        Used by Bank B to screen new customers
        """
        profile_bytes, _exists = op.Box.get(hashed_id)
        profile = WalletRiskProfile.from_bytes(profile_bytes)
        return profile.is_flagged

    @abimethod
    def get_risk_score(self, hashed_id: Bytes) -> UInt64:
        """
        Get just the risk score for a wallet (0-100)
        """
        profile_bytes, _exists = op.Box.get(hashed_id)
        profile = WalletRiskProfile.from_bytes(profile_bytes)
        return profile.risk_score

    @abimethod
    def hello(self, name: String) -> String:
        """
        Simple hello method for testing
        """
        return String("Hello, ") + name
