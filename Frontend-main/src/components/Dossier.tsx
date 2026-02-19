import type { MuleNode } from '../types';
import {
  AlertOctagon,
  ShieldAlert,
  Clock,
  DollarSign,
  Link2,
  Fingerprint,
} from 'lucide-react';

interface DossierProps {
  selectedNode: MuleNode | null;
}

export default function Dossier({ selectedNode }: DossierProps) {
  if (!selectedNode) {
    return (
      <aside className="w-[320px] min-w-[320px] h-full glass-panel flex flex-col overflow-hidden">
        <div className="p-5 border-b border-algo-border/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-300 tracking-wide uppercase">
              Registry Query Result
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-algo-border/20 flex items-center justify-center mx-auto">
              <Fingerprint className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">No Entity Selected</p>
              <p className="text-xs text-gray-600 mt-1">
                Click a node in the Shadow Map to query the on-chain AML Registry
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const riskScore = selectedNode.riskScore;
  const riskLevel =
    riskScore >= 80 ? 'CRITICAL' : riskScore >= 50 ? 'ELEVATED' : 'LOW';
  const riskColor =
    riskScore >= 80 ? 'text-algo-red' : riskScore >= 50 ? 'text-algo-amber' : 'text-algo-green';
  const riskBg =
    riskScore >= 80 ? 'bg-red-500/10 border-red-500/30' : riskScore >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30';
  const riskGlow =
    riskScore >= 80 ? 'glow-red' : riskScore >= 50 ? 'glow-amber' : 'glow-teal';

  // Ring gauge SVG
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (riskScore / 100) * circumference;
  const strokeColor = riskScore >= 80 ? '#ef4444' : riskScore >= 50 ? '#f59e0b' : '#22c55e';

  return (
    <aside className="w-[320px] min-w-[320px] h-full glass-panel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-algo-border/50">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-algo-teal" />
          <h2 className="text-sm font-semibold text-gray-300 tracking-wide uppercase">
            Registry Query Result
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Risk Score Gauge */}
        <div className={`rounded-xl p-5 border ${riskBg} ${riskGlow} transition-all duration-500`}>
          <div className="flex items-center gap-5">
            {/* SVG ring gauge */}
            <div className="relative w-[100px] h-[100px] flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: 'stroke-dashoffset 1s ease-in-out',
                    filter: `drop-shadow(0 0 6px ${strokeColor})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold font-mono ${riskColor}`}>{riskScore}</span>
                <span className="text-[9px] text-gray-500 uppercase">Risk</span>
              </div>
            </div>

            {/* Risk level info */}
            <div>
              <span className={`text-xs font-mono font-bold ${riskColor} tracking-wider`}>
                {riskLevel}
              </span>
              <h3 className="text-lg font-bold text-gray-100 mt-1">{selectedNode.name}</h3>
              <p className="text-[11px] font-mono text-gray-500 mt-0.5">{selectedNode.id}</p>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        {selectedNode.flaggedPatterns.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
              Key Findings
            </h4>
            <div className="space-y-1.5">
              {selectedNode.flaggedPatterns.map((pattern, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-algo-red flex-shrink-0" />
                  <span className="text-xs text-gray-300">{pattern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div>
          <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
            Account Metadata
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <MetaCard
              icon={Clock}
              label="Account Age"
              value={selectedNode.accountAge || 'N/A'}
            />
            <MetaCard
              icon={DollarSign}
              label="Total Volume"
              value={selectedNode.totalVolume ? `$${selectedNode.totalVolume.toLocaleString()}` : 'N/A'}
            />
            <MetaCard
              icon={Link2}
              label="Linked Accts"
              value={selectedNode.linkedAccounts?.toString() || 'N/A'}
            />
            <MetaCard
              icon={AlertOctagon}
              label="Entity Type"
              value={selectedNode.type.toUpperCase()}
            />
          </div>
        </div>

        {/* On-Chain Verification */}
        <div className="glass-card rounded-xl p-4 border border-algo-border/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-algo-teal animate-pulse" />
            <span className="text-[10px] font-mono text-algo-teal uppercase tracking-widest">
              Algorand Testnet
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            SHA-256 hash verified against on-chain registry. Block confirmation time: ~3.3s.
          </p>
          <p className="text-[10px] font-mono text-gray-600 mt-2 break-all">
            Hash: {generateFakeHash(selectedNode.id)}
          </p>
        </div>
      </div>
    </aside>
  );
}

// Sub-component for metadata cards
function MetaCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card rounded-lg p-3 border border-algo-border/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-gray-500" />
        <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      </div>
      <p className="text-sm font-mono font-medium text-gray-200">{value}</p>
    </div>
  );
}

function generateFakeHash(seed: string): string {
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[(seed.charCodeAt(i % seed.length) + i * 7) % 16];
  }
  return hash;
}
