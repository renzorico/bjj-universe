import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
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
  ready: boolean;
  getNodeScreenPosition: (nodeId: string) => { x: number; y: number } | null;
  selectNode: (nodeId: string | null) => void;
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
  const graphRef = useRef<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >(undefined);
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
      ready: false,
      selectNode: (nodeId: string | null) => onSelectAthlete(nodeId),
      getNodeScreenPosition: (nodeId: string) => {
        const node = nodeById.get(nodeId);
        const graph = graphRef.current;

        if (
          !node ||
          !graph ||
          typeof node.x !== 'number' ||
          typeof node.y !== 'number'
        ) {
          return null;
        }

        const rect = container.getBoundingClientRect();
        const screenPoint = graph.graph2ScreenCoords(node.x, node.y);

        return {
          x: rect.left + screenPoint.x,
          y: rect.top + screenPoint.y,
        };
      },
    };

    const readyTimer = window.setTimeout(() => {
      if (window.__BJJ_UNIVERSE_GRAPH__) {
        window.__BJJ_UNIVERSE_GRAPH__.ready = true;
      }
    }, 180);

    return () => {
      window.clearTimeout(readyTimer);
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, onSelectAthlete, size.height, size.width]);

  useEffect(() => {
    if (!graphRef.current || data.nodes.length === 0) {
      return;
    }

    const graph = graphRef.current;
    const fitTimer = window.setTimeout(() => {
      resetView(graph, data, 0);
    }, 40);

    return () => window.clearTimeout(fitTimer);
  }, [data, size.height, size.width]);

  if (data.nodes.length === 0 || data.links.length === 0) {
    return renderFallback(
      'No matches in view',
      'Adjust the year, sex, or weight-class filters to restore athletes and observed match connections.',
    );
  }

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(122,162,255,0.18),_transparent_34%),radial-gradient(circle_at_20%_15%,_rgba(95,225,197,0.12),_transparent_28%),linear-gradient(180deg,_rgba(4,10,17,0.22),_rgba(4,10,17,0.08))]" />

      <button
        type="button"
        onClick={() => {
          onSelectAthlete(null);
          onHoverAthlete(null);
          resetView(graphRef.current, data, 280);
        }}
        className="absolute right-3 bottom-3 z-10 rounded-full border border-white/12 bg-[rgba(5,10,18,0.72)] px-3 py-2 text-[11px] tracking-[0.14em] text-[var(--text-secondary)] uppercase backdrop-blur-md transition hover:bg-[rgba(8,14,24,0.86)] sm:right-4 sm:bottom-4"
      >
        Reset view
      </button>

      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[520px] w-full"
      >
        {size.width > 0 && size.height > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            width={size.width}
            height={size.height}
            graphData={data}
            backgroundColor="rgba(0,0,0,0)"
            nodeLabel={(node) => node.label}
            linkCurvature={(link) => resolveLinkCurvature(link, focusState)}
            linkColor={(link) => resolveLinkColor(link, focusState)}
            linkWidth={(link) => resolveLinkWidth(link, focusState)}
            nodePointerAreaPaint={paintNodePointerArea}
            nodeCanvasObject={(node, context, scale) =>
              drawNode(node, context, scale, focusState)
            }
            autoPauseRedraw={false}
            minZoom={0.35}
            maxZoom={8}
            cooldownTicks={0}
            enableNodeDrag={false}
            enablePointerInteraction
            showPointerCursor={(item) => Boolean(item)}
            onNodeHover={(node) => onHoverAthlete(node?.id ?? null)}
            onNodeClick={(node) => onSelectAthlete(node.id)}
            onBackgroundClick={() => {
              onSelectAthlete(null);
              onHoverAthlete(null);
            }}
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
  const focusId = selectedAthleteId ?? hoveredAthleteId;
  const activeNodeIds = new Set<string>();
  const activeLinkIds = new Set<string>();

  if (!focusId) {
    return {
      activeNodeIds,
      activeLinkIds,
      hasFocus: false,
      selectedId: selectedAthleteId,
      hoveredId: hoveredAthleteId,
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
    selectedId: selectedAthleteId,
    hoveredId: hoveredAthleteId,
  };
}

function resolveNodeColor(
  node: ForceGraphNode,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (focusState.selectedId === node.id) {
    return 'rgba(255,255,255,0.98)';
  }

  if (!focusState.hasFocus) {
    return withAlpha(node.color, 0.92);
  }

  if (focusState.activeNodeIds.has(node.id)) {
    return withAlpha(node.color, focusState.hoveredId === node.id ? 1 : 0.98);
  }

  return 'rgba(102, 120, 154, 0.16)';
}

function resolveNodeSize(
  node: ForceGraphNode,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return node.size;
  }

  if (focusState.selectedId === node.id) {
    return node.size * 1.7;
  }

  if (focusState.activeNodeIds.has(node.id)) {
    return node.size * 1.16;
  }

  return Math.max(1.8, node.size * 0.54);
}

function resolveLinkColor(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return withAlpha(link.color, 0.3);
  }

  if (focusState.activeLinkIds.has(link.id)) {
    return withAlpha(link.color, 0.84);
  }

  return 'rgba(88, 102, 126, 0.04)';
}

function resolveLinkWidth(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return Math.max(0.5, link.width * 0.7);
  }

  return focusState.activeLinkIds.has(link.id) ? link.width + 0.45 : 0.25;
}

function resolveLinkCurvature(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (focusState.activeLinkIds.has(link.id)) {
    return 0.14;
  }

  return link.rivalryCount > 1 ? 0.1 : 0.04;
}

function drawNode(
  node: ForceGraphNode,
  context: CanvasRenderingContext2D,
  globalScale: number,
  focusState: ReturnType<typeof buildFocusState>,
) {
  const radius = resolveNodeSize(node, focusState);
  const color = resolveNodeColor(node, focusState);
  const shouldShowLabel =
    focusState.selectedId === node.id ||
    focusState.hoveredId === node.id ||
    (!focusState.hasFocus && node.importance >= 14);

  context.save();
  context.beginPath();
  context.fillStyle = color;
  context.shadowBlur =
    focusState.selectedId === node.id
      ? 30
      : focusState.activeNodeIds.has(node.id)
        ? 18
        : 10;
  context.shadowColor = color;
  context.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
  context.fill();

  context.beginPath();
  context.lineWidth = focusState.selectedId === node.id ? 2.4 : 1.2;
  context.strokeStyle =
    focusState.selectedId === node.id
      ? 'rgba(255,255,255,0.82)'
      : 'rgba(255,255,255,0.16)';
  context.arc(node.x, node.y, radius + 1.2, 0, 2 * Math.PI, false);
  context.stroke();
  context.restore();

  if (!shouldShowLabel) {
    return;
  }

  const fontSize = Math.max(10, 12 / globalScale);
  const label = node.label;
  context.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`;
  const textWidth = context.measureText(label).width;
  const textX = node.x + radius + 8;
  const textY = node.y - radius - 2;

  context.save();
  context.fillStyle = 'rgba(5, 10, 18, 0.84)';
  context.fillRect(textX - 6, textY - fontSize, textWidth + 12, fontSize + 8);
  context.fillStyle = 'rgba(245, 248, 255, 0.94)';
  context.fillText(label, textX, textY);
  context.restore();
}

function paintNodePointerArea(
  node: ForceGraphNode,
  color: string,
  context: CanvasRenderingContext2D,
) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(node.x, node.y, Math.max(node.size + 5, 10), 0, 2 * Math.PI);
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

function resetView(
  graph: ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined,
  data: ForceGraphData,
  durationMs: number,
) {
  if (!graph) {
    return;
  }

  graph.centerAt(
    data.meta.initialCamera.lookAt.x,
    data.meta.initialCamera.lookAt.y,
    durationMs,
  );
  graph.zoom(1.08, durationMs);
  graph.zoomToFit(durationMs, 120);
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
