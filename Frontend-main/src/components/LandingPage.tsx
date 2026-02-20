import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, FileText, Loader2, AlertTriangle, ScanSearch } from 'lucide-react';

interface LandingPageProps {
  onUploadComplete: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
  onKycClick: () => void;
}

export default function LandingPage({ onUploadComplete, setIsLoading, onKycClick }: LandingPageProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const formStartTime = useRef(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    const elapsed = Date.now() - formStartTime.current;
    if (elapsed < 400) {
      setError('Submission rejected: Speed anomaly detected.');
      return;
    }
    if (honeypot) {
      setError('Session terminated: Unauthorized access pattern.');
      return;
    }
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setUploading(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('[LandingPage] Uploading to backend:', `${API_URL}/detect`);
      const response = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        body: formData,
      });

      console.log('[LandingPage] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[LandingPage] Backend error:', errorText);
        throw new Error(`Backend error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[LandingPage] Backend data received:', data);
      onUploadComplete(data);
    } catch (err: any) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.error('[LandingPage] Upload failed:', err, 'API_URL:', API_URL);
      setError(`Connection failed: ${err.message}. Tried: ${API_URL}/detect`);
    } finally {
      setUploading(false);
      setIsLoading(false);
    }
  }, [honeypot, onUploadComplete, setIsLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
      {/* Honeypot */}
      <div className="admin_override_code_wrapper">
        <input
          type="text"
          id="admin_override_code_landing"
          name="admin_override_code"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Branding */}
      <motion.div
        layoutId="app-branding"
        className="text-center mb-8"
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-algo-teal/20 to-indigo-500/20 flex items-center justify-center border border-algo-teal/30 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
            <Shield className="w-8 h-8 text-algo-teal" />
          </div>
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-2">
          <span className="text-glow-teal text-algo-teal">OZARK</span>{' '}
          <span className="text-gray-200">SENTINEL</span>
        </h1>
        <p className="text-sm font-mono tracking-[0.3em] text-white uppercase">
          The Algorand-Backed Decentralized AML Registry
        </p>
      </motion.div>

      {/* Action Row: Drop Zone + KYC Button */}
      <div className="flex items-stretch gap-4 w-full max-w-2xl">
        {/* Drop Zone */}
        <motion.div
          layoutId="upload-zone"
          className="flex-1"
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        >
          <div
            className={`rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 border-2 border-dashed backdrop-blur-md ${isDragOver
              ? 'border-algo-teal bg-algo-teal/10 scale-[1.02]'
              : 'border-algo-border bg-[#0d1320]/80 hover:border-algo-teal/40 hover:bg-[#0d1320]/90'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleInputChange}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-algo-teal animate-spin" />
                <div>
                  <p className="text-base text-gray-300 font-medium">Analyzing transactions...</p>
                  <p className="text-xs text-gray-500 mt-1">Running graph cycle detection</p>
                </div>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-12 h-12 text-algo-teal" />
                <div>
                  <p className="text-base text-gray-300 font-medium">{fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">Processing complete — entering dashboard</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-algo-border/40 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg text-gray-200 font-medium">
                    Drop Transaction CSV
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    or click to browse files
                  </p>
                </div>
                <div className="flex items-center gap-6 mt-2 text-[11px] text-gray-500">
                  <span>Graph Analysis</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span>Cycle Detection</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span>Risk Scoring</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-algo-red text-sm bg-red-500/10 rounded-lg px-4 py-3 mt-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>

        {/* KYC Verify Button */}
        <motion.button
          onClick={onKycClick}
          className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 border-2 border-dashed border-algo-border bg-[#0d1320]/80 hover:border-algo-teal/40 hover:bg-[#0d1320]/90 backdrop-blur-md flex flex-col items-center gap-4 min-w-[180px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-algo-teal/10 border border-algo-teal/30 flex items-center justify-center">
            <ScanSearch className="w-8 h-8 text-algo-teal" />
          </div>
          <div>
            <p className="text-lg text-gray-200 font-medium">KYC Verify</p>
            <p className="text-sm text-gray-400 mt-1">PAN Identity Check</p>
          </div>
        </motion.button>
      </div>

      {/* Bottom branding line */}
      <motion.p
        className="mt-12 text-[12px] text-white font-mono tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        POWERED BY ALGORAND TESTNET &bull; DECENTRALIZED AML REGISTRY
      </motion.p>
    </div>
  );
}
