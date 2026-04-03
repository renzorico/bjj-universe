import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ForceGraphData,
  ForceGraphLink,
  ForceGraphNode,
} from '@/features/graph/lib/buildForceGraphData';

interface GraphCanvasProps {
  data: ForceGraphData;
  selectedAthleteId: string | null;
  hoveredAthleteId: string | null;
  onSelectAthlete: (athleteId: string | null) => void;
  onHoverAthlete: (athleteId: string | null) => void;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface GraphTestApi {
  getNodeScreenPosition: (nodeId: string) => { x: number; y: number } | null;
}

declare global {
  interface Window {
    __BJJ_UNIVERSE_GRAPH__?: GraphTestApi;
  }
}

export function GraphCanvas({
  data,
  selectedAthleteId,
  hoveredAthleteId,
  onSelectAthlete,
  onHoverAthlete,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const nodeById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node] as const)),
    [data.nodes],
  );
  const focusState = useMemo(
    () => buildFocusState(data, selectedAthleteId, hoveredAthleteId),
    [data, hoveredAthleteId, selectedAthleteId],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const element = containerRef.current;
    const updateSize = () => {
      setSize({
        width: Math.max(1, Math.floor(element.clientWidth)),
        height: Math.max(1, Math.floor(element.clientHeight)),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || size.width <= 0 || size.height <= 0) {
      return undefined;
    }

    window.__BJJ_UNIVERSE_GRAPH__ = {
      getNodeScreenPosition: (nodeId: string) => {
        const node = nodeById.get(nodeId);

        if (!node) {
          return null;
        }

        const rect = container.getBoundingClientRect();

        return {
          x: rect.left + size.width / 2 + node.x,
          y: rect.top + size.height / 2 + node.y,
        };
      },
    };

    return () => {
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, size.height, size.width]);

  if (data.nodes.length === 0 || data.links.length === 0) {
    return renderFallback(
      'No matches in view',
      'Adjust the year or division filters to restore athletes and observed match connections.',
    );
  }

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(122,162,255,0.12),_transparent_46%)]" />
      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[520px] w-full"
      >
        {size.width > 0 && size.height > 0 ? (
          <ForceGraph2D
            width={size.width}
            height={size.height}
            graphData={data}
            cooldownTicks={0}
            d3AlphaDecay={1}
            enableNodeDrag={false}
            enablePanInteraction={false}
            enableZoomInteraction={false}
            backgroundColor="rgba(0,0,0,0)"
            linkDirectionalParticles={0}
            nodePointerAreaPaint={paintNodePointerArea}
            linkWidth={(link) =>
              resolveLinkWidth(link as ForceGraphLink, focusState)
            }
            linkColor={(link) =>
              resolveLinkColor(link as ForceGraphLink, focusState)
            }
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={(link) =>
              resolveLinkColor(link as ForceGraphLink, focusState)
            }
            onBackgroundClick={() => onSelectAthlete(null)}
            onNodeHover={(node) =>
              onHoverAthlete((node as ForceGraphNode | null)?.id ?? null)
            }
            onNodeClick={(node) => onSelectAthlete((node as ForceGraphNode).id)}
            nodeCanvasObject={(node, context) =>
              paintNode(
                node as ForceGraphNode,
                context,
                focusState,
                selectedAthleteId,
                hoveredAthleteId,
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function buildFocusState(
  data: ForceGraphData,
  selectedAthleteId: string | null,
  hoveredAthleteId: string | null,
) {
  const focusId = hoveredAthleteId ?? selectedAthleteId;
  const activeNodeIds = new Set<string>();
  const activeLinkIds = new Set<string>();

  if (!focusId) {
    return {
      activeNodeIds,
      activeLinkIds,
      hasFocus: false,
    };
  }

  activeNodeIds.add(focusId);

  for (const link of data.links) {
    if (link.source === focusId || link.target === focusId) {
      activeLinkIds.add(link.id);
      activeNodeIds.add(link.source);
      activeNodeIds.add(link.target);
    }
  }

  return {
    activeNodeIds,
    activeLinkIds,
    hasFocus: true,
  };
}

function resolveLinkColor(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return withAlpha(link.color, 0.46);
  }

  if (focusState.activeLinkIds.has(link.id)) {
    return withAlpha(link.color, 0.92);
  }

  return 'rgba(125, 147, 183, 0.08)';
}

function resolveLinkWidth(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return link.width;
  }

  return focusState.activeLinkIds.has(link.id) ? link.width + 0.6 : 0.4;
}

function paintNode(
  node: ForceGraphNode,
  context: CanvasRenderingContext2D,
  focusState: ReturnType<typeof buildFocusState>,
  selectedAthleteId: string | null,
  hoveredAthleteId: string | null,
) {
  const selected = selectedAthleteId === node.id;
  const hovered = hoveredAthleteId === node.id;
  const active = !focusState.hasFocus || focusState.activeNodeIds.has(node.id);
  const radius = node.size + (selected ? 4 : hovered ? 2 : 0);

  context.beginPath();
  context.arc(node.x, node.y, radius, 0, Math.PI * 2, false);
  context.fillStyle = active ? node.color : 'rgba(125, 147, 183, 0.18)';
  context.fill();

  if (selected || hovered) {
    context.beginPath();
    context.arc(node.x, node.y, radius + 5, 0, Math.PI * 2, false);
    context.strokeStyle = selected
      ? 'rgba(157, 219, 211, 0.95)'
      : 'rgba(122, 162, 255, 0.72)';
    context.lineWidth = 2;
    context.stroke();
  }

  if (selected || hovered || node.activeMatches >= 8) {
    context.font = '12px Space Grotesk';
    context.fillStyle = '#edf3ff';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    context.fillText(node.label, node.x, node.y - radius - 8);
  }
}

function paintNodePointerArea(
  node: object,
  color: string,
  context: CanvasRenderingContext2D,
) {
  const graphNode = node as ForceGraphNode;

  context.fillStyle = color;
  context.beginPath();
  context.arc(
    graphNode.x,
    graphNode.y,
    graphNode.size + 8,
    0,
    2 * Math.PI,
    false,
  );
  context.fill();
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith('rgba(')) {
    return color.replace(/rgba\(([^)]+),\s*[\d.]+\)$/, `rgba($1, ${alpha})`);
  }

  if (color.startsWith('hsla(')) {
    return color.replace(/hsla\(([^)]+),\s*[\d.]+\)$/, `hsla($1, ${alpha})`);
  }

  return color;
}

function renderFallback(title: string, description: string) {
  return (
    <div className="flex h-full min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 text-center">
      <div>
        <p className="font-display text-2xl text-white">{title}</p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
