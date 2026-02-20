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

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
      setError(`Backend connection failed: ${err.message}. Using mock data for demo.`);
      // If backend is unreachable, generate mock data for demo
      const mockData = generateMockData();
      onUploadComplete(mockData);
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

// Mock data generator for demo when backend is unavailable
function generateMockData() {
  const names = [
    'Viktor Petrov', 'Elena Sorokina', 'Dmitri Volkov', 'Natasha Federova',
    'Sergei Kozlov', 'Olga Ivanova', 'Alexei Kuznetsov', 'Marina Popova',
    'Andrei Smirnov', 'Irina Morozova', 'Boris Lebedev', 'Tatiana Novak',
  ];

  const patterns = [
    'Rapid fund cycling', 'Structuring under $10K', 'Shell company transfers',
    'Cross-border smurfing', 'Layered transactions', 'Round-trip wash',
    'Velocity spike', 'Dormant account activation',
  ];

  const nodes = names.map((name, i) => ({
    id: `ACC-${1000 + i}`,
    name,
    riskScore: Math.floor(Math.random() * 60) + 40,
    type: (Math.random() > 0.6 ? 'mule' : Math.random() > 0.5 ? 'shell' : 'normal') as 'mule' | 'shell' | 'normal',
    flaggedPatterns: patterns.filter(() => Math.random() > 0.6),
    accountAge: `${Math.floor(Math.random() * 48) + 1} months`,
    totalVolume: Math.floor(Math.random() * 500000) + 10000,
    linkedAccounts: Math.floor(Math.random() * 8) + 1,
  }));

  // Make some high-risk
  nodes[0].riskScore = 95;
  nodes[0].type = 'mule';
  nodes[0].flaggedPatterns = ['Rapid fund cycling', 'Cross-border smurfing', 'Velocity spike'];
  nodes[1].riskScore = 88;
  nodes[1].type = 'mule';
  nodes[2].riskScore = 92;
  nodes[2].type = 'shell';
  nodes[3].riskScore = 85;
  nodes[3].type = 'mule';

  const links: { source: string; target: string; value: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const numLinks = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numLinks; j++) {
      const target = Math.floor(Math.random() * nodes.length);
      if (target !== i) {
        links.push({
          source: nodes[i].id,
          target: nodes[target].id,
          value: Math.floor(Math.random() * 100000) + 5000,
        });
      }
    }
  }

  // Create a cycle for the first few nodes
  links.push({ source: nodes[0].id, target: nodes[1].id, value: 45000 });
  links.push({ source: nodes[1].id, target: nodes[2].id, value: 43000 });
  links.push({ source: nodes[2].id, target: nodes[3].id, value: 41000 });
  links.push({ source: nodes[3].id, target: nodes[0].id, value: 39000 });

  return {
    mules: nodes.filter(n => n.riskScore > 80),
    graph: { nodes, links },
    summary: {
      totalTransactions: 10247,
      flaggedAccounts: nodes.filter(n => n.riskScore > 80).length,
      averageRiskScore: Math.round(nodes.reduce((a, b) => a + b.riskScore, 0) / nodes.length),
      detectedCycles: 3,
    },
  };
}
