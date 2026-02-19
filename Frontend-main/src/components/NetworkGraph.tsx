import { useCallback, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
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
  const data = useMemo(() => ({
    nodes: graphData.nodes.map(n => ({ ...n })),
    links: graphData.links.map(l => ({ ...l })),
  }), [graphData]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge')?.strength(-300);
      graphRef.current.d3Force('link')?.distance(80);
    }
  }, [data]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || node.id;
    const fontSize = 11 / globalScale;
    const isHighRisk = node.riskScore > 80;
    const isMediumRisk = node.riskScore > 50;
    const nodeRadius = isHighRisk ? 8 : isMediumRisk ? 6 : 5;

    // Determine colors
    const fillColor = isHighRisk ? '#ef4444' : isMediumRisk ? '#f59e0b' : '#00E5FF';
    const glowColor = isHighRisk ? '#ef4444' : isMediumRisk ? '#f59e0b' : '#00E5FF';

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = `${glowColor}15`;
    ctx.fill();

    // Neon glow effect
    ctx.shadowBlur = isHighRisk ? 20 : 12;
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

    // Label text
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, node.x, node.y + nodeRadius + 3);

    // Risk score badge for flagged nodes
    if (isHighRisk) {
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
    const sourceRisk = link.source.riskScore || 0;
    const targetRisk = link.target.riskScore || 0;
    const maxRisk = Math.max(sourceRisk, targetRisk);

    const color = maxRisk > 80 ? '#ef444440' : maxRisk > 50 ? '#f59e0b30' : '#00E5FF20';

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = maxRisk > 80 ? 2 : 1;
    ctx.stroke();

    // Animated particles on high-risk links
    if (maxRisk > 80) {
      const t = (Date.now() % 2000) / 2000;
      const px = link.source.x + (link.target.x - link.source.x) * t;
      const py = link.source.y + (link.target.y - link.source.y) * t;

      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  return (
    <div className="force-graph-container w-full h-full">
      <ForceGraph2D
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
        cooldownTicks={100}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
