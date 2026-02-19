import { Shield, Activity, ChevronRight, Zap, ArrowLeftRight, ScanSearch } from 'lucide-react';
import FileUpload from './FileUpload';

interface SidebarProps {
  onUploadComplete: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  responseData: any;
  onReturnHome: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'disruption', label: 'Active Disruption', icon: Zap },
  { id: 'kyc', label: 'KYC Verify', icon: ScanSearch },
  { id: 'transactions', label: 'Blockchain Audit', icon: ArrowLeftRight },
];

export default function Sidebar({
  onUploadComplete,
  isLoading,
  setIsLoading,
  activeSection,
  setActiveSection,
  responseData,
  onReturnHome,
}: SidebarProps) {
  return (
    <aside className="w-[280px] min-w-[280px] h-full glass-panel flex flex-col overflow-hidden">
      {/* Header / Branding with Spline 3D */}
      <div className="p-5 border-b border-algo-border/50">
        <button
          onClick={onReturnHome}
          className="w-full flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-algo-teal/20 to-indigo-500/20 flex items-center justify-center border border-algo-teal/30">
            <Shield className="w-5 h-5 text-algo-teal" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-glow-teal text-algo-teal">OZARK</span>{' '}
              <span className="text-gray-300">SENTINEL</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              Immutable Threat Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${isActive
                ? 'bg-algo-teal/10 text-algo-teal border border-algo-teal/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-algo-teal' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-algo-teal/60" />}
            </button>
          );
        })}
      </nav>


      {/* File Upload */}
      <div className="px-4 flex-1 overflow-auto">
        <FileUpload
          onUploadComplete={onUploadComplete}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          responseData={responseData}
        />
      </div>
    </aside>
  );
}
