import { TrendingUp, Users, AlertTriangle, Waypoints } from 'lucide-react';

interface StatsRowProps {
  summary: {
    totalTransactions: number;
    flaggedAccounts: number;
    averageRiskScore: number;
    detectedCycles: number;
  } | null;
}

export default function StatsRow({ summary }: StatsRowProps) {
  const stats = [
    {
      label: 'Transactions Scanned',
      value: summary ? summary.totalTransactions.toLocaleString() : '—',
      icon: TrendingUp,
      color: 'text-algo-teal',
      bgColor: 'bg-algo-teal/10',
      borderColor: 'border-algo-teal/20',
    },
    {
      label: 'Flagged Accounts',
      value: summary ? summary.flaggedAccounts.toString() : '—',
      icon: Users,
      color: 'text-algo-red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'Avg Risk Score',
      value: summary ? `${summary.averageRiskScore}%` : '—',
      icon: AlertTriangle,
      color: 'text-algo-amber',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Detected Cycles',
      value: summary ? summary.detectedCycles.toString() : '—',
      icon: Waypoints,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`glass-card rounded-xl p-4 ${stat.borderColor} transition-all duration-300 hover:scale-[1.02] cursor-default`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
