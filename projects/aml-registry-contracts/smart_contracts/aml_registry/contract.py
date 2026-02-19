from algopy import ARC4Contract, String, UInt64, Global, Bytes, op
from algopy.arc4 import abimethod, Struct


class WalletRiskProfile(Struct):
    """Risk profile for a wallet address stored on-chain"""
    risk_score: UInt64  # 0-100 scale
    transaction_count: UInt64
    flagged_connections: UInt64
    last_updated: UInt64  # Timestamp
    is_flagged: UInt64  # 0 = false, 1 = true (using UInt64 for storage)


class AmlRegistry(ARC4Contract):
    """
    Anti-Money Laundering Registry Smart Contract
    Stores wallet risk profiles and AML flags on Algorand blockchain
    Privacy-preserving: Uses SHA-256 hashed IDs instead of raw wallet addresses
    """

    @abimethod
    def register_wallet(
        self,
        hashed_id: Bytes,
        risk_score: UInt64,
        transaction_count: UInt64,
        flagged_connections: UInt64,
    ) -> String:
        """
        Register a new wallet with its risk profile
        hashed_id: SHA-256 hash of the wallet/account ID
        risk_score: 0-100 risk score
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
        )
        
        # Store profile in box storage (key: hashed_id)
        op.Box.put(hashed_id, profile.bytes)
        
        return String("Wallet registered successfully")

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
