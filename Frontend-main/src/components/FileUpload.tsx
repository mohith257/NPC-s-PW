import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, AlertTriangle, Loader2, Download } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  responseData: any;
}

export default function FileUpload({ onUploadComplete, isLoading, setIsLoading, responseData }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const formStartTime = useRef(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    // Bot Trap: Speed-limit middleware (The Stopwatch)
    const elapsed = Date.now() - formStartTime.current;
    if (elapsed < 400) {
      setError('Submission rejected: Speed anomaly detected.');
      return;
    }

    // Bot Trap: Honeypot check (The Invisible Box)
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
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-31faa.up.railway.app';
      console.log('Uploading to backend:', `${API_URL}/detect`);
      const response = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        body: formData,
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend data received:', data);
      onUploadComplete(data);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(`Backend connection failed: ${err.message}. Please ensure backend is running.`);
    } finally {
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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="space-y-3">
      {/* Honeypot - invisible to humans, visible to bots */}
      <div className="admin_override_code_wrapper">
        <label htmlFor="admin_override_code">Admin Override</label>
        <input
          type="text"
          id="admin_override_code"
          name="admin_override_code"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Only show drop zone if no data has been loaded yet */}
      {!responseData && (
        <div
          className={`drop-zone rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${isDragOver ? 'drag-over' : ''
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
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

          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-algo-teal animate-spin" />
              <p className="text-sm text-gray-400">Analyzing transactions...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-3">
              <FileText className="w-8 h-8 text-algo-teal" />
              <p className="text-sm text-gray-300">{fileName}</p>
              <p className="text-xs text-gray-500">Click or drop to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-algo-teal transition-colors" />
              <div>
                <p className="text-sm text-gray-300 font-medium">Drop CSV here</p>
                <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download JSON Output Button */}
      {responseData && (
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(responseData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'aml_detection_output.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full flex items-center justify-center gap-2 bg-algo-teal/10 hover:bg-algo-teal/20 text-algo-teal border border-algo-teal/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          Downloadable JSON Output
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-algo-red text-xs bg-red-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}


