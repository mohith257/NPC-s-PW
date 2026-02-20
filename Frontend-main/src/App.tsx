import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useVantaBackground } from './hooks/useVantaBackground';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import StatsRow from './components/StatsRow';
import NetworkGraph from './components/NetworkGraph';
import LedgerTable from './components/LedgerTable';
import Dossier from './components/Dossier';
import PanVerify from './components/PanVerify';
import type { MuleNode, GraphData, DetectionResult } from './types';
import { Radar, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

function App() {
  // Vanta.js background — stays mounted behind both states
  const vantaRef = useVantaBackground({
    color: 0x00E5FF,
    backgroundColor: 0x0A0E17,
    points: 10,
    maxDistance: 20,
  });

  // Landing → Dashboard state
  const [hasUploaded, setHasUploaded] = useState(false);

  // Dashboard state
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedNode, setSelectedNode] = useState<MuleNode | null>(null);
  const [mules, setMules] = useState<MuleNode[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [summary, setSummary] = useState<DetectionResult['summary'] | null>(null);
  const [responseData, setResponseData] = useState<any>(null);

  // Graph container sizing
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!hasUploaded) return;

    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        setGraphDimensions({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 200),
        });
      }
    };

    // Delay initial measurement until after entry animation completes
    const timer = setTimeout(() => {
      updateDimensions();
      const observer = new ResizeObserver(updateDimensions);
      if (graphContainerRef.current) {
        observer.observe(graphContainerRef.current);
      }
      observerRef.current = observer;
    }, 800);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [hasUploaded]);

  // Handle upload response — triggers the landing → dashboard transition
  const handleUploadComplete = useCallback((data: any) => {
    setResponseData(data);
    if (data.graph) {
      setGraphData(data.graph);
    }
    if (data.mules) {
      setMules(data.mules);
    }
    if (data.summary) {
      setSummary(data.summary);
    }
    if (data.mules && data.mules.length > 0) {
      setSelectedNode(data.mules[0]);
    }
    // Trigger transition
    setHasUploaded(true);
  }, []);

  // Handle node click from graph
  const handleNodeClick = useCallback((node: MuleNode) => {
    setSelectedNode(node);
  }, []);

  const dashboardFadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' as const },
  };

  return (
    <div ref={vantaRef} className="h-screen w-screen flex overflow-hidden relative">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!hasUploaded ? (
            /* ── LANDING STATE ── */
            <motion.div
              key="landing"
              className="absolute inset-0 z-20"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandingPage
                onUploadComplete={handleUploadComplete}
                setIsLoading={setIsLoading}
                onKycClick={() => {
                  setHasUploaded(true);
                  setActiveSection('kyc');
                }}
              />
            </motion.div>
          ) : (
            /* ── DASHBOARD STATE ── */
            <motion.div
              key="dashboard"
              className="flex w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Left Sidebar */}
              <Sidebar
                onUploadComplete={handleUploadComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                responseData={responseData}
                onReturnHome={() => setHasUploaded(false)}
              />

              {/* Center + Right Panels */}
              {activeSection === 'kyc' ? (
                <PanVerify />
              ) : (
                <>
                  {/* Center Panel */}
                  <motion.main
                    className="flex-1 flex flex-col overflow-hidden p-4 gap-4"
                    {...dashboardFadeIn}
                    transition={{ ...dashboardFadeIn.transition, delay: 0.3 }}
                  >
                    {/* Stats Row */}
                    <motion.div
                      {...dashboardFadeIn}
                      transition={{ ...dashboardFadeIn.transition, delay: 0.4 }}
                    >
                      <StatsRow summary={summary} />
                    </motion.div>

                    {/* Shadow Map (Graph) */}
                    <motion.div
                      className="flex-1 glass-card rounded-xl border border-algo-border/30 overflow-hidden relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {/* Graph Header */}
                      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-algo-dark/80 to-transparent pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                          <Radar className="w-4 h-4 text-algo-teal animate-pulse" />
                          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                            Shadow Map — Transaction Network
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors">
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Graph Render Area */}
                      <div ref={graphContainerRef} className="w-full h-full">
                        {graphData.nodes.length > 0 ? (
                          <NetworkGraph
                            graphData={graphData}
                            onNodeClick={handleNodeClick}
                            width={graphDimensions.width}
                            height={graphDimensions.height}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 rounded-full border border-algo-teal/20 animate-ping" style={{ animationDuration: '3s' }} />
                                <div className="absolute inset-2 rounded-full border border-algo-teal/15 animate-ping" style={{ animationDuration: '3.5s' }} />
                                <div className="absolute inset-4 rounded-full border border-algo-teal/10 animate-ping" style={{ animationDuration: '4s' }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Radar className="w-8 h-8 text-algo-teal/40" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 font-medium">Awaiting Transaction Data</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Upload a CSV file to visualize the transaction network
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Legend */}
                      {graphData.nodes.length > 0 && (
                        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-4 bg-algo-dark/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-algo-border/30">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="text-[10px] text-gray-400">Mule</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[10px] text-gray-400">Fraud Ring</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] text-gray-400">Normal</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                            <span className="text-[10px] text-gray-400">Ring Link</span>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Ledger Table */}
                    <motion.div
                      {...dashboardFadeIn}
                      transition={{ ...dashboardFadeIn.transition, delay: 0.6 }}
                    >
                      <LedgerTable mules={mules} onRowClick={handleNodeClick} />
                    </motion.div>
                  </motion.main>

                  {/* Right Panel: Dossier */}
                  <motion.div
                    {...dashboardFadeIn}
                    transition={{ ...dashboardFadeIn.transition, delay: 0.5 }}
                  >
                    <Dossier selectedNode={selectedNode} />
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

export default App;
