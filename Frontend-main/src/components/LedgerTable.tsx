import type { MuleNode } from '../types';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface LedgerTableProps {
  mules: MuleNode[];
  onRowClick: (node: MuleNode) => void;
}

export default function LedgerTable({ mules, onRowClick }: LedgerTableProps) {
  if (mules.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-algo-border/30 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No flagged entities yet</p>
        <p className="text-xs text-gray-600 mt-1">Upload transaction data to begin analysis</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl border border-algo-border/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-algo-border/30 flex items-center justify-between">
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          Detected Money Mules
        </h3>
        <span className="text-[10px] font-mono bg-algo-red/10 text-algo-red px-2 py-0.5 rounded-full border border-algo-red/20">
          {mules.length} flagged
        </span>
      </div>

      <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-algo-border/20">
              <th className="text-left px-4 py-2.5 font-mono font-medium uppercase tracking-wider">ID</th>
              <th className="text-left px-4 py-2.5 font-mono font-medium uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-2.5 font-mono font-medium uppercase tracking-wider">Type</th>
              <th className="text-center px-4 py-2.5 font-mono font-medium uppercase tracking-wider">Risk</th>
              <th className="text-left px-4 py-2.5 font-mono font-medium uppercase tracking-wider">Patterns</th>
              <th className="text-center px-4 py-2.5 font-mono font-medium uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {mules.map((mule) => (
              <tr
                key={mule.id}
                onClick={() => onRowClick(mule)}
                className="border-b border-algo-border/10 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-mono text-gray-300">{mule.id}</td>
                <td className="px-4 py-3 text-gray-200 font-medium">{mule.name}</td>
                <td className="px-4 py-3">
                  <TypeChip type={mule.type} />
                </td>
                <td className="px-4 py-3 text-center">
                  <RiskBadge score={mule.riskScore} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {mule.flaggedPatterns.slice(0, 2).map((p, i) => (
                      <span key={i} className="text-[10px] bg-algo-border/30 text-gray-400 rounded px-1.5 py-0.5 truncate max-w-[100px]">
                        {p}
                      </span>
                    ))}
                    {mule.flaggedPatterns.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{mule.flaggedPatterns.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-500 hover:text-algo-teal transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    mule: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-algo-red' },
    shell: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-algo-amber' },
    normal: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-algo-green' },
  };
  const c = config[type] || config.normal;
  return (
    <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-algo-red/20 text-algo-red border-red-500/30' :
      score >= 50 ? 'bg-amber-500/20 text-algo-amber border-amber-500/30' :
        'bg-green-500/20 text-algo-green border-green-500/30';

  return (
    <span className={`risk-badge border ${color}`}>
      {score}
    </span>
  );
}
