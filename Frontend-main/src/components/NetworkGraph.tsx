import { useCallback, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceManyBody, forceCollide, forceX, forceY } from 'd3-force';
import type { GraphData, MuleNode } from '../types';

interface NetworkGraphProps {
  graphData: GraphData;
  onNodeClick: (node: MuleNode) => void;
  width: number;
  height: number;
}

export default function NetworkGraph({ graphData, onNodeClick, width, height }: NetworkGraphProps) {
  const graphRef = useRef<any>(null);
  
  // Stabilize graph data to avoid triggering re-renders
  const data = useMemo(() => {
    // Debug: log node types
    console.log('Graph nodes:', graphData.nodes.map(n => ({ id: n.id, type: n.type, risk: n.riskScore })));
    return {
      nodes: graphData.nodes.map(n => ({ ...n })),
      links: graphData.links.map(l => ({ ...l })),
    };
  }, [graphData]);
  
  // Force complete remount by creating unique key from actual data
  const graphKey = useMemo(() => {
    const hash = graphData.nodes.map(n => `${n.id}:${n.type}`).sort().join('|');
    return hash;
  }, [graphData]);

  // Configure D3 forces to merge disconnected components into one visual cluster
  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      
      // forceX/forceY pull EVERY node toward center — critical for merging disconnected groups
      fg.d3Force('x', forceX(width / 2).strength(0.15));
      fg.d3Force('y', forceY(height / 2).strength(0.15));
      
      // Gentle repulsion so nodes don't stack on top of each other
      fg.d3Force('charge', forceManyBody().strength(-80));
      
      // Collision detection to prevent label overlap
      fg.d3Force('collide', forceCollide(30));
      
      // Tighten link distance for connected nodes
      fg.d3Force('link')?.distance(40).strength(1.5);
      
      // Remove default center force (forceX/Y replaces it)
      fg.d3Force('center', null);
      
      // Reheat simulation to apply new forces
      fg.d3ReheatSimulation();
    }
  }, [graphKey, width, height]);

  // Reheat on data change
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
    }
  }, [data]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || node.id;
    const fontSize = 11 / globalScale;
    
    // Determine node type and colors
    const isMule = node.type === 'mule';
    const isRing = node.type === 'ring';
    const isNormal = node.type === 'normal';
    
    const nodeRadius = (isMule || isRing) ? 8 : 5;
    
    // Color scheme: Mules (red), Rings (orange), Normal (blue)
    let fillColor, glowColor;
    if (isRing) {
      fillColor = '#f59e0b';  // Orange for fraud rings
      glowColor = '#f59e0b';
    } else if (isMule) {
      fillColor = '#ef4444';  // Red for general mules
      glowColor = '#ef4444';
    } else {
      fillColor = '#3b82f6';  // Blue for normal users
      glowColor = '#3b82f6';
    }

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = `${glowColor}15`;
    ctx.fill();

    // Neon glow effect
    ctx.shadowBlur = (isMule || isRing) ? 20 : 12;
    ctx.shadowColor = glowColor;

    // Main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(node.x - nodeRadius * 0.2, node.y - nodeRadius * 0.2, nodeRadius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // Reset shadow for text
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Node border
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `${glowColor}80`;
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();

    // Label background
    ctx.font = `${fontSize}px 'Inter', sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const bgPadding = 3 / globalScale;

    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.beginPath();
    ctx.roundRect(
      node.x - textWidth / 2 - bgPadding,
      node.y + nodeRadius + 3 - bgPadding,
      textWidth + bgPadding * 2,
      fontSize + bgPadding * 2,
      2 / globalScale,
    );
    ctx.fill();

    // Label text with appropriate color
    ctx.fillStyle = isNormal ? '#94a3b8' : glowColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, node.x, node.y + nodeRadius + 3);

    // Risk score badge for flagged nodes
    if ((isMule || isRing) && node.riskScore > 0) {
      const badgeText = `${node.riskScore}`;
      const badgeFontSize = 9 / globalScale;
      ctx.font = `bold ${badgeFontSize}px 'JetBrains Mono', monospace`;
      const badgeWidth = ctx.measureText(badgeText).width + 6 / globalScale;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.roundRect(
        node.x - badgeWidth / 2,
        node.y - nodeRadius - badgeFontSize - 5 / globalScale,
        badgeWidth,
        badgeFontSize + 4 / globalScale,
        2 / globalScale,
      );
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(badgeText, node.x, node.y - nodeRadius - badgeFontSize - 3 / globalScale);
    }
  }, []);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const sourceIsRing = link.source.type === 'ring';
    const targetIsRing = link.target.type === 'ring';
    const sourceIsMule = link.source.type === 'mule';
    const targetIsMule = link.target.type === 'mule';
    const isRingConnection = link.isRingConnection;
    const bothNormal = link.source.type === 'normal' && link.target.type === 'normal';

    // Determine color and width based on edge type
    let color, lineWidth, shouldAnimate;
    
    if (isRingConnection) {
      // Fraud ring connections - pink/magenta
      color = '#ec489980';
      lineWidth = 3;
      shouldAnimate = true;
    } else if ((sourceIsRing && (targetIsMule || targetIsRing)) || (targetIsRing && (sourceIsMule || sourceIsRing))) {
      // Ring member connections - orange
      color = '#f59e0b80';
      lineWidth = 2.5;
      shouldAnimate = true;
    } else if (sourceIsMule || targetIsMule) {
      // General mule connections - red
      color = '#ef444460';
      lineWidth = 2;
      shouldAnimate = sourceIsMule && targetIsMule;
    } else if (bothNormal) {
      // Normal user connections - blue/gray
      color = '#94a3b820';
      lineWidth = 1;
      shouldAnimate = false;
    } else {
      // Default - cyan
      color = '#00E5FF20';
      lineWidth = 1;
      shouldAnimate = false;
    }

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Animated particles on flagged connections
    if (shouldAnimate) {
      const t = (Date.now() % 2000) / 2000;
      const px = link.source.x + (link.target.x - link.source.x) * t;
      const py = link.source.y + (link.target.y - link.source.y) * t;

      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      const particleColor = isRingConnection ? '#ec4899' : '#ef4444';
      ctx.fillStyle = particleColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = particleColor;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  return (
    <div className="force-graph-container w-full h-full">
      <ForceGraph2D
        key={graphKey}
        ref={graphRef}
        graphData={data}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node: any) => onNodeClick(node as MuleNode)}
        cooldownTicks={200}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.35}
        linkDistance={50}
        linkStrength={1}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />
    </div>
  );
}
