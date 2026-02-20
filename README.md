<p align="center">
  <img src="https://img.shields.io/badge/Algorand-TestNet-00C2FF?style=for-the-badge&logo=algorand&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</p>

<h1 align="center">🛡️ OZARK SENTINEL</h1>

<p align="center">
  <b>The Algorand-Backed Decentralized AML Intelligence Platform</b><br>
  <i>Detect money mules. Flag fraud rings. Immutably. On-chain.</i>
</p>

<p align="center">
  <a href="https://npcfrontend2.vercel.app/">🌐 Live Demo</a> •
  <a href="https://lora.algokit.io/testnet/application/755804610">🔗 Smart Contract on Lora</a> •
  <a href="https://web-production-31faa.up.railway.app/">⚙️ API Endpoint</a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [System Design](#-system-design)
- [Detection Algorithms](#-detection-algorithms)
- [Smart Contract](#-smart-contract)
- [IPFS Integration](#-ipfs-integration)
- [Frontend](#-frontend)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Security Features](#-security-features)

---

## 🔍 Overview

**OZARK Sentinel** is a full-stack decentralized Anti-Money Laundering (AML) platform that leverages the **Algorand blockchain**, **IPFS**, and **graph-based fraud detection** to identify money mules and fraud rings from banking transaction data.

When a bank uploads transaction CSV data, the system:
1. **Analyzes** transaction flows using graph algorithms (NetworkX)
2. **Detects** money mules, fraud rings, smurfing, and shell networks
3. **Visualizes** the entire transaction network as a force-directed graph
4. **Flags** detected mules permanently on-chain using **Soul Bound Tokens** on Algorand
5. **Stores** detailed evidence on **IPFS** for immutable audit trails

> Think of it as a **decentralized financial crime watchdog** — once a mule is flagged, the record is **permanent, tamper-proof, and publicly verifiable** across all banks.

---

## 🚨 Problem Statement

### The Money Mule Epidemic

Money mules are individuals who transfer illegally obtained funds on behalf of criminal organizations. They are the **weakest link** in the money laundering chain but the **hardest to detect** because:

- **Cross-Bank Blindness**: Bank A cannot see Bank B's flagged accounts
- **Identity Hopping**: Mules open accounts at multiple institutions
- **Micro-structuring (Smurfing)**: Transactions kept under reporting thresholds ($10K)
- **Circular Routing**: Funds pass through 3-5 intermediaries and return to the origin
- **Shell Networks**: Dormant accounts activated briefly for layered transfers

### Our Solution

OZARK Sentinel creates a **shared, immutable AML ledger** on Algorand:

| Traditional AML | OZARK Sentinel |
|---|---|
| Siloed per bank | Shared across all institutions |
| Mutable records | Immutable blockchain flags |
| Manual review | Automated graph detection |
| No evidence trail | IPFS-backed audit trail |
| Reactive (after fraud) | Proactive (real-time flagging) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OZARK SENTINEL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    CSV Upload    ┌───────────────────────────┐   │
│  │              │ ──────────────► │    FastAPI Backend         │   │
│  │   React +    │                  │                           │   │
│  │   Vite       │ ◄────────────── │  ┌─────────────────────┐  │   │
│  │   Frontend   │   JSON Response  │  │  Graph Analyzer     │  │   │
│  │              │                  │  │  (NetworkX)         │  │   │
│  │  ┌────────┐  │                  │  │                     │  │   │
│  │  │Force   │  │                  │  │  • Cycle Detection  │  │   │
│  │  │Graph   │  │                  │  │  • Smurfing         │  │   │
│  │  │2D      │  │                  │  │  • Shell Networks   │  │   │
│  │  └────────┘  │                  │  │  • High Velocity    │  │   │
│  │              │                  │  └─────────────────────┘  │   │
│  │  ┌────────┐  │                  │                           │   │
│  │  │Dossier │  │                  │  ┌─────────────────────┐  │   │
│  │  │Panel   │  │                  │  │  Blockchain Layer   │  │   │
│  │  └────────┘  │                  │  │                     │  │   │
│  │              │                  │  │  Algorand TestNet   │  │   │
│  │  ┌────────┐  │                  │  │  App ID: 755804610  │  │   │
│  │  │KYC     │  │                  │  │                     │  │   │
│  │  │Verify  │  │                  │  │  • register_wallet  │  │   │
│  │  └────────┘  │                  │  │  • flag_wallet      │  │   │
│  └──────────────┘                  │  │  • is_wallet_flagged│  │   │
│                                    │  └─────────────────────┘  │   │
│                                    │                           │   │
│                                    │  ┌─────────────────────┐  │   │
│                                    │  │  IPFS Layer         │  │   │
│                                    │  │                     │  │   │
│                                    │  │  PAN Mapping CID:   │  │   │
│                                    │  │  QmdSjyrrBLvdH4G.. │  │   │
│                                    │  └─────────────────────┘  │   │
│                                    └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CSV Upload ──► Parse & Validate ──► Build DiGraph (NetworkX)
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │                     │                      │
              Cycle Detection      Smurfing Detection    Shell Network
              (3-5 node rings)     (fan-in/fan-out)      (dormant chains)
                    │                     │                      │
                    └─────────────────────┼──────────────────────┘
                                          │
                                   Risk Scoring (0-100)
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                    Return JSON to Frontend    Auto-Flag on Algorand
                    (nodes, edges, stats)      (Soul Bound Tokens)
                              │                       │
                    Render Force Graph         Box Storage + IPFS
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async API server |
| **NetworkX** | Graph-based fraud detection algorithms |
| **Pandas** | CSV parsing and data manipulation |
| **py-algorand-sdk** | Algorand blockchain interaction |
| **IPFS (Kubo v0.39.0)** | Decentralized evidence storage |
| **Python 3.11** | Runtime |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite 7** | Build tooling and HMR |
| **react-force-graph-2d** | Canvas-based network visualization |
| **d3-force** | Force simulation for graph layout |
| **Framer Motion** | Animations and transitions |
| **TailwindCSS** | Utility-first styling |
| **Vanta.js** | Animated 3D neural network background |
| **Lucide React** | Icon system |

### Blockchain & Infrastructure
| Technology | Purpose |
|---|---|
| **Algorand TestNet** | Immutable ledger for mule flags |
| **AlgoPy (ARC4)** | Smart contract language |
| **ARC-56** | Contract ABI standard |
| **Box Storage** | On-chain key-value storage for wallet profiles |
| **Soul Bound Tokens** | Non-transferable identity flags |
| **Railway** | Backend cloud deployment |
| **Vercel** | Frontend CDN deployment |

---

## ⚙️ System Design

### 1. Graph Construction
```python
# Every transaction becomes a directed edge in a NetworkX DiGraph
G = nx.DiGraph()
for _, row in df.iterrows():
    G.add_edge(sender_id, receiver_id, amount=amount, count=1)
```

### 2. Multi-Pattern Detection Engine
The system runs **4 parallel detection algorithms** on the transaction graph:

| # | Algorithm | What It Detects | Method |
|---|---|---|---|
| 1 | **Cycle Detection** | Money mule rings (circular fund flow) | `nx.simple_cycles()` filtering 3–5 node cycles |
| 2 | **Smurfing Detection** | Structuring under $10K thresholds | Fan-in/fan-out ratio analysis on node degree |
| 3 | **Shell Network Detection** | Dormant intermediary chains | Chain topology with low in/out degree intermediaries |
| 4 | **High Velocity Detection** | Burst transaction accounts | Transaction count velocity spikes |

### 3. Risk Scoring Formula
```
Risk Score = base_score
  + 25 (if in mule ring cycle)
  + 20 (if smurfing pattern)
  + 15 (if in shell network)
  + 10 (if high velocity)
  + degree_bonus (based on graph connectivity)

Capped at 100. Flagged if ≥ 60 AND ≥ 2 patterns detected.
```

### 4. False Positive Controls
- **Multi-pattern confirmation**: Only flag if ≥2 independent patterns trigger
- **Trusted account whitelist**: Exclude PAYROLL, AMAZON, GOVT, INSURANCE, etc.
- **Minimum risk threshold**: Score must be ≥60 to be flagged

---

## 🔗 Smart Contract

**App ID**: [`755804610`](https://lora.algokit.io/testnet/application/755804610) on Algorand TestNet

Written in **AlgoPy** using ARC4 standards with **Box Storage** for on-chain data.

### Contract Methods

| Method | Description | Access |
|---|---|---|
| `register_wallet` | Register wallet with risk profile + IPFS hash | Creator |
| `update_risk_score` | Update risk score for existing wallet | Creator |
| `flag_wallet` | Manually flag a wallet for AML review | Creator |
| `is_wallet_flagged` | Check if a wallet is flagged (returns 0 or 1) | Public |
| `get_risk_score` | Get risk score (0–100) for a wallet | Public |
| `get_risk_profile` | Get full `WalletRiskProfile` struct | Public |
| `get_ipfs_hash` | Get IPFS CID pointing to detailed evidence | Public |

### On-Chain Data Structure
```python
class WalletRiskProfile(Struct):
    risk_score: UInt64         # 0-100 risk scale
    transaction_count: UInt64  # Number of transactions analyzed
    flagged_connections: UInt64 # Connected flagged accounts
    last_updated: UInt64       # Block timestamp
    is_flagged: UInt64         # 0 = clean, 1 = flagged (Soul Bound)
    ipfs_hash_length: UInt64   # Length of IPFS CID stored separately
```

### Soul Bound Token Concept
- Flags are **non-transferable** — once flagged, always flagged
- Any bank can **query** the contract to check if a customer is flagged
- **SHA-256 hashed IDs** preserve privacy (no raw PAN/names on-chain)
- Detailed evidence stored on **IPFS**, referenced by CID in the contract

### Auto-Flagging Flow
```
CSV Upload → Detect Mules → For each mule:
  1. SHA-256 hash the account ID
  2. Call register_wallet() via AtomicTransactionComposer
  3. Store risk_score, flagged_connections, IPFS CID in Box Storage
  4. Transaction confirmed on TestNet → permanent, immutable record
```

---

## 📦 IPFS Integration

- **IPFS Node**: Kubo v0.39.0
- **PAN Mapping CID**: `QmdSjyrrBLvdH4Gjda1wMrk9sGrLowGBEbP5VnxuNZkydN`

### What's Stored on IPFS
- KYC PAN-to-name mapping (hashed, for verification)
- Future: Detailed mule dossiers, graph snapshots, full evidence packages

### Why IPFS?
- **Decentralized**: No single point of failure
- **Content-addressed**: CID guarantees data integrity (tamper-proof)
- **Permanent**: Pinned data persists across the network
- **Cost-efficient**: Only store the CID on-chain, not the full payload

---

## 🖥️ Frontend

### Landing Page
- Animated **Vanta.js** neural network background
- Drag-and-drop CSV upload zone with file validation
- KYC PAN verification shortcut button
- Bot protection (honeypot field + timing trap)

### Dashboard (post CSV upload)
| Panel | Description |
|---|---|
| **Shadow Map** | Force-directed graph visualization of the entire transaction network |
| **Stats Row** | Transactions scanned, flagged accounts, avg risk score, detected cycles |
| **Ledger Table** | Sortable table of all detected mules with risk scores and patterns |
| **Dossier Panel** | Detailed profile of selected node — patterns, volume, connections |

### Graph Color Coding
| Element | Color | Meaning |
|---|---|---|
| 🔴 Red nodes | `#ef4444` | Detected money mules |
| 🟠 Orange nodes | `#f59e0b` | Fraud ring members |
| 🔵 Blue nodes | `#3b82f6` | Normal/clean accounts |
| 💗 Pink edges | `#ec4899` | Ring connections (animated particles) |
| 🔴 Red edges | `#ef4444` | Mule-to-mule connections |
| ⚪ Gray edges | `#94a3b8` | Normal transaction flow |

- Powered by `react-force-graph-2d` with custom `d3-force` simulation
- `forceX`/`forceY` (strength 0.15) pulls disconnected subgraphs into unified view
- Custom `forceCollide(30)` prevents node overlap

### Sidebar Navigation
| Button | Action |
|---|---|
| **Dashboard** | View graph + stats + ledger |
| **KYC Verify** | Verify PAN number against IPFS KYC records |
| **Blockchain Audit** | Opens [Lora Explorer](https://lora.algokit.io/testnet/application/755804610) to inspect on-chain transactions |

---

## 📡 API Reference

### `POST /detect`
Upload a CSV file to run fraud detection and auto-flag mules to blockchain.

**Request**: `multipart/form-data` with `file` field (CSV)

**Required CSV Columns**:
```csv
sender_id,receiver_id,amount,timestamp
ACC001,ACC002,5000,2024-01-15
ACC002,ACC003,4800,2024-01-16
ACC003,ACC001,4500,2024-01-17
```

**Response**:
```json
{
  "mules": [
    {
      "id": "ACC001",
      "name": "ACC001",
      "riskScore": 85,
      "type": "mule",
      "flaggedPatterns": ["Circular Routing", "Smurfing"],
      "totalVolume": 150000,
      "linkedAccounts": 5
    }
  ],
  "graph": {
    "nodes": [
      { "id": "ACC001", "name": "ACC001", "type": "mule", "riskScore": 85 },
      { "id": "ACC004", "name": "ACC004", "type": "ring", "riskScore": 75 },
      { "id": "ACC005", "name": "ACC005", "type": "normal", "riskScore": 20 }
    ],
    "links": [
      { "source": "ACC001", "target": "ACC002", "value": 5000, "isRingConnection": true }
    ]
  },
  "summary": {
    "totalTransactions": 247,
    "flaggedAccounts": 8,
    "averageRiskScore": 72,
    "detectedCycles": 3
  },
  "blockchain_results": {
    "flagged_on_chain": ["ACC001", "ACC002", "ACC003"],
    "failed": [],
    "app_id": 755804610,
    "network": "testnet"
  }
}
```

### `POST /verify-pan`
Verify a PAN number against IPFS-stored KYC records.

**Request**:
```json
{
  "pan_number": "ABCDE1234F",
  "customer_name": "John Doe"
}
```

**Response**:
```json
{
  "verified": true,
  "message": "PAN verified successfully",
  "name_match": true
}
```

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [npcfrontend2.vercel.app](https://npcfrontend2.vercel.app/) |
| **Backend** | Railway | [web-production-31faa.up.railway.app](https://web-production-31faa.up.railway.app/) |
| **Smart Contract** | Algorand TestNet | [App ID 755804610](https://lora.algokit.io/testnet/application/755804610) |
| **IPFS** | Kubo Node | CID: `QmdSjyrrBLvdH4Gjda1wMrk9sGrLowGBEbP5VnxuNZkydN` |

### Deployment Architecture
```
[User Browser]
      │
      ▼
[Vercel CDN] ── serves static React build (global edge network)
      │
      │  fetch(VITE_API_URL + "/detect")
      ▼
[Railway] ── FastAPI + uvicorn (europe-west4)
      │
      ├──► [Algorand TestNet] ── AlgoNode public API (no auth required)
      │         └── App 755804610 (Box Storage for Soul Bound flags)
      │
      └──► [IPFS Network] ── Kubo gateway
               └── PAN Mapping + Evidence CIDs
```

---

## 📁 Project Structure

```
ozark-sentinel/
├── backend/                          # FastAPI Backend (Railway)
│   ├── main.py                       # API server — /detect, /verify-pan, CORS, auto-flagging
│   ├── graph_analyzer.py             # NetworkX fraud detection engine
│   ├── graph_visualizer.py           # Matplotlib graph export (optional)
│   ├── requirements.txt              # Python dependencies
│   ├── Procfile                      # Railway: uvicorn main:app --host 0.0.0.0 --port $PORT
│   ├── railway.toml                  # Railway build config (NIXPACKS)
│   └── runtime.txt                   # Python 3.11.9
│
├── Frontend-main/                    # React Frontend (Vercel)
│   ├── src/
│   │   ├── App.tsx                   # Root layout, state management, legend
│   │   ├── main.tsx                  # React entry point
│   │   ├── index.css                 # Tailwind base + custom glass styles
│   │   ├── components/
│   │   │   ├── LandingPage.tsx       # Hero + CSV upload + KYC shortcut
│   │   │   ├── NetworkGraph.tsx      # Force-directed graph (d3-force + canvas)
│   │   │   ├── Sidebar.tsx           # Navigation + re-upload + Lora link
│   │   │   ├── StatsRow.tsx          # Summary stats cards (4 metrics)
│   │   │   ├── LedgerTable.tsx       # Mule table with click-to-select
│   │   │   ├── Dossier.tsx           # Selected node detail panel
│   │   │   ├── PanVerify.tsx         # KYC PAN verification form
│   │   │   ├── FileUpload.tsx        # CSV upload with bot protection
│   │   │   └── SplineViewer.tsx      # 3D Spline viewer component
│   │   ├── hooks/
│   │   │   └── useVantaBackground.ts # Vanta.js animated background hook
│   │   └── types/
│   │       └── index.ts              # TypeScript interfaces (GraphData, MuleNode, etc.)
│   ├── vercel.json                   # SPA routing rewrites
│   ├── package.json                  # NPM dependencies
│   ├── tailwind.config.js            # Custom theme (algo-teal, algo-dark, etc.)
│   └── vite.config.ts                # Vite build configuration
│
├── projects/
│   └── aml-registry-contracts/       # Algorand Smart Contract
│       └── smart_contracts/
│           └── aml_registry/
│               ├── contract.py       # AlgoPy ARC4 contract (158 lines)
│               └── deploy_config.py  # Deployment configuration
│
└── README.md                         # ← You are here
```

---

## 🏁 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- AlgoKit CLI (for local blockchain development)
- IPFS Kubo (optional, for KYC verification features)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Algorand credentials

# Run the server
python main.py
# ✅ Server starts at http://localhost:8000
```

### Frontend Setup
```bash
cd Frontend-main
npm install

# Local development (backend on localhost:8000)
npm run dev
# ✅ Opens at http://localhost:5173

# Production build with custom API URL
VITE_API_URL=https://your-backend.up.railway.app npm run build
```

### Smart Contract (Local Development)
```bash
# Start Algorand LocalNet via Docker
algokit localnet start

# Build and deploy contract
cd projects/aml-registry-contracts
poetry install
python -m smart_contracts build
python -m smart_contracts deploy
```

---

## 🔐 Environment Variables

### Backend (.env on Railway)
| Variable | Value | Description |
|---|---|---|
| `ALGOD_SERVER` | `https://testnet-api.algonode.cloud` | Algorand node API endpoint |
| `ALGOD_TOKEN` | _(empty)_ | AlgoNode requires no token |
| `APP_ID` | `755804610` | Deployed smart contract application ID |
| `CREATOR_MNEMONIC` | `<25-word mnemonic>` | Account private key for signing transactions |
| `NETWORK` | `testnet` | Network mode (localnet / testnet / mainnet) |
| `PORT` | `8000` | HTTP server port |

### Frontend (Vercel Environment Variables)
| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://web-production-31faa.up.railway.app` | Backend API base URL (baked in at build time) |

> **Important**: Vite env vars are embedded at **build time**. After changing `VITE_API_URL`, you must **redeploy** on Vercel for the change to take effect.

---

## 🔒 Security Features

| Feature | Description |
|---|---|
| **SHA-256 Hashing** | Account IDs are hashed before on-chain storage — no raw PII on blockchain |
| **Honeypot Field** | Hidden form field that traps automated bot submissions |
| **Timing Trap** | Rejects uploads submitted in < 400ms (inhuman speed = bot) |
| **CORS Whitelist** | API restricted to known frontend origins (localhost, *.vercel.app) |
| **Soul Bound Tokens** | Blockchain flags are non-transferable and permanent |
| **IPFS Content Addressing** | CID-based integrity — data cannot be tampered with post-upload |
| **Box Storage Isolation** | On-chain data isolated per wallet key (no data leakage) |
| **Multi-Pattern Threshold** | Requires ≥2 detection patterns to flag (reduces false positives) |

---

## 🧠 Detection Example

```
Input CSV:
  ACC001 → ACC002 (₹5,000)
  ACC002 → ACC003 (₹4,800)
  ACC003 → ACC001 (₹4,500)   ← Circular! Money returned to origin
  ACC004 → ACC005 (₹9,999)   ← Just under ₹10K threshold (smurfing)
  ACC004 → ACC006 (₹9,998)
  ACC004 → ACC007 (₹9,997)

Detection Output:
  🔴 ACC001 — Risk: 85 — [Circular Routing]        → MULE
  🔴 ACC002 — Risk: 80 — [Circular Routing]        → MULE
  🔴 ACC003 — Risk: 80 — [Circular Routing]        → MULE
  🟠 ACC004 — Risk: 75 — [Smurfing, High Velocity] → FRAUD RING
  🔵 ACC005 — Risk: 20 — Normal                    → CLEAN
  🔵 ACC006 — Risk: 20 — Normal                    → CLEAN
  🔵 ACC007 — Risk: 20 — Normal                    → CLEAN

Blockchain (automatic):
  ✅ ACC001 → Soul Bound Token created (Box: risk=85, flagged=1)
  ✅ ACC002 → Soul Bound Token created (Box: risk=80, flagged=1)
  ✅ ACC003 → Soul Bound Token created (Box: risk=80, flagged=1)
  ✅ ACC004 → Soul Bound Token created (Box: risk=75, flagged=1)
```

---

<p align="center">
  <b>OZARK SENTINEL</b> — <i>Immutable Threat Intelligence on Algorand</i><br>
  <sub>Every transaction tells a story. We make sure the criminals can't rewrite theirs.</sub>
</p>
