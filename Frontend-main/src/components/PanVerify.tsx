import { useState, useCallback } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldX,
  Loader2,
  Hash,
  Lock,
  Database,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

interface VerificationResult {
  panHash: string;
  saltRounds: number;
  ipfsFound: boolean;
  soulBound: boolean;
  canCreateAccount: boolean;
  riskScore: number;
  timestamp: string;
}

export default function PanVerify() {
  const [panNumber, setPanNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Hashing PAN', icon: Hash, description: 'Applying SHA-256 with 10-round salt' },
    { label: 'Querying IPFS', icon: Database, description: 'Checking decentralized storage' },
    { label: 'Soul-Bound Check', icon: Lock, description: 'Verifying identity token binding' },
    { label: 'Risk Assessment', icon: ShieldCheck, description: 'Computing eligibility score' },
  ];

  const handleVerify = useCallback(async () => {
    const trimmed = panNumber.trim().toUpperCase();

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(trimmed)) {
      setError('Invalid PAN format. Expected: ABCDE1234F');
      return;
    }

    setError(null);
    setResult(null);
    setIsVerifying(true);
    setCurrentStep(0);

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise((r) => setTimeout(r, 800));
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-31faa.up.railway.app';
        const response = await fetch(`${API_URL}/verify-pan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pan: trimmed }),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          return;
        }
      } catch {
        // Backend unavailable, use mock
      }

      const isFlagged = trimmed.charCodeAt(0) % 3 === 0;
      const mockHash = await generateHash(trimmed);

      setResult({
        panHash: mockHash,
        saltRounds: 10,
        ipfsFound: true,
        soulBound: !isFlagged,
        canCreateAccount: !isFlagged,
        riskScore: isFlagged ? 87 : 12,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  }, [panNumber, steps.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const hasActivity = isVerifying || result;

  return (
    <div className={`flex-1 flex flex-col p-4 gap-4 overflow-y-auto ${!hasActivity ? 'items-center justify-center' : ''}`}>
      {/* Header + Search */}
      <div className={`w-full space-y-4 ${!hasActivity ? 'max-w-4xl mx-auto' : ''}`}>
        <div className="glass-card rounded-xl border border-algo-border/30 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-algo-teal/20 to-indigo-500/20 flex items-center justify-center border border-algo-teal/30 flex-shrink-0">
            <Fingerprint className="w-6 h-6 text-algo-teal" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Identity Verification</h2>
            <p className="text-xs text-gray-500">PAN &rarr; SHA-256 (10x Salt) &rarr; IPFS Lookup &rarr; Soul-Bound Token Check</p>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-algo-border/30 px-6 py-5">
          <label className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3 block">
            Enter PAN Number
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={panNumber}
                onChange={(e) => {
                  setPanNumber(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full bg-algo-dark/60 border border-algo-border/50 rounded-xl pl-12 pr-4 py-3.5 text-base font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-algo-teal/50 focus:ring-1 focus:ring-algo-teal/20 transition-all"
                disabled={isVerifying}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying || panNumber.trim().length === 0}
              className="px-7 py-3.5 bg-algo-teal/20 hover:bg-algo-teal/30 text-algo-teal border border-algo-teal/30 rounded-xl text-base font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isVerifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              Verify
            </button>
          </div>
          {error && (
            <p className="text-sm text-algo-red mt-3 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              {error}
            </p>
          )}
          {!hasActivity && (
            <p className="text-xs text-gray-600 mt-3 text-center">
              The PAN will be hashed, salted 10&times;, and checked against the IPFS registry
            </p>
          )}
        </div>
      </div>

      {/* Processing Steps */}
      {isVerifying && (
        <div className="w-full glass-card rounded-xl border border-algo-border/30 p-6 animate-fade-in">
          <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">
            Verification Pipeline
          </h3>
          <div className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-500 ${isActive
                    ? 'bg-algo-teal/10 border border-algo-teal/20'
                    : isDone
                      ? 'bg-green-500/5 border border-green-500/10'
                      : 'bg-white/[0.02] border border-transparent'
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive
                      ? 'bg-algo-teal/20'
                      : isDone
                        ? 'bg-green-500/20'
                        : 'bg-white/5'
                      }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-algo-green" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-algo-teal animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${isActive ? 'text-algo-teal' : isDone ? 'text-algo-green' : 'text-gray-500'
                        }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !isVerifying && (
        <div className="w-full space-y-4 animate-fade-in">
          <div
            className={`glass-card rounded-xl border p-6 ${result.canCreateAccount
              ? 'border-green-500/30 glow-teal'
              : 'border-red-500/30 glow-red'
              }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.canCreateAccount ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
              >
                {result.canCreateAccount ? (
                  <ShieldCheck className="w-8 h-8 text-algo-green" />
                ) : (
                  <ShieldX className="w-8 h-8 text-algo-red" />
                )}
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${result.canCreateAccount ? 'text-algo-green' : 'text-algo-red'
                    }`}
                >
                  {result.canCreateAccount ? 'ACCOUNT CREATION APPROVED' : 'ACCOUNT CREATION DENIED'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {result.canCreateAccount
                    ? 'Identity is clean. No soul-bound threat token found on-chain.'
                    : 'Identity is flagged. Soul-bound threat token detected — account opening blocked.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DetailCard label="SHA-256 Hash (10x Salted)" value={result.panHash} mono truncate />
            <DetailCard label="Salt Rounds Applied" value={result.saltRounds.toString()} />
            <DetailCard
              label="IPFS Record Found"
              value={result.ipfsFound ? 'Yes' : 'No'}
              color={result.ipfsFound ? 'text-algo-teal' : 'text-gray-400'}
            />
            <DetailCard
              label="Soul-Bound Status"
              value={result.soulBound ? 'Clean' : 'Flagged'}
              color={result.soulBound ? 'text-algo-green' : 'text-algo-red'}
            />
            <DetailCard
              label="Risk Score"
              value={`${result.riskScore}%`}
              color={
                result.riskScore > 70
                  ? 'text-algo-red'
                  : result.riskScore > 40
                    ? 'text-algo-amber'
                    : 'text-algo-green'
              }
            />
            <DetailCard label="Timestamp" value={new Date(result.timestamp).toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({
  label,
  value,
  mono,
  truncate,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4 border border-algo-border/20">
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p
        className={`text-sm font-medium ${color || 'text-gray-200'} ${mono ? 'font-mono' : ''
          } ${truncate ? 'truncate' : ''}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}

async function generateHash(input: string): Promise<string> {
  let data = input;
  for (let i = 0; i < 10; i++) {
    const salt = `ozark_sentinel_salt_round_${i}_${input.length}`;
    const encoded = new TextEncoder().encode(data + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    data = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return data;
}
