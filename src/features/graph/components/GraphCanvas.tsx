import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { ForceGraphMethods } from 'react-force-graph-3d';
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

type FocusState = ReturnType<typeof buildFocusState>;

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
    [data, selectedAthleteId, hoveredAthleteId],
  );

  // Measure container for responsive canvas
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      setSize({
        width: Math.max(1, Math.floor(element.clientWidth)),
        height: Math.max(1, Math.floor(element.clientHeight)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fit camera to scene when data changes
  useEffect(() => {
    if (!graphRef.current || data.nodes.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      resetView(graphRef.current, 0);
    }, 40);

    return () => window.clearTimeout(timer);
  }, [data]);

  // Expose test API
  useEffect(() => {
    const container = containerRef.current;
    if (!container || size.width <= 0 || size.height <= 0) return undefined;

    window.__BJJ_UNIVERSE_GRAPH__ = {
      ready: false,
      selectNode: (nodeId) => onSelectAthlete(nodeId),
      getNodeScreenPosition: (nodeId) => {
        const node = nodeById.get(nodeId);
        const graph = graphRef.current;
        if (!node || !graph || node.x == null || node.y == null) return null;
        const rect = container.getBoundingClientRect();
        const screenPoint = graph.graph2ScreenCoords(node.x, node.y, node.z ?? 0);
        return { x: rect.left + screenPoint.x, y: rect.top + screenPoint.y };
      },
    };

    const readyTimer = window.setTimeout(() => {
      if (window.__BJJ_UNIVERSE_GRAPH__) {
        window.__BJJ_UNIVERSE_GRAPH__.ready = true;
      }
    }, 120);

    return () => {
      window.clearTimeout(readyTimer);
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, onSelectAthlete, size.width, size.height]);

  if (data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 text-center">
        <div>
          <p className="font-display text-2xl text-white">No matches in view</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            Adjust the year, sex, or weight-class filters to restore athletes
            and observed match connections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(122,162,255,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,_rgba(105,129,255,0.14),_transparent_30%),radial-gradient(circle_at_22%_18%,_rgba(95,225,197,0.08),_transparent_24%),linear-gradient(180deg,_rgba(4,10,17,0.18),_rgba(4,10,17,0.04))]" />

      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[520px] w-full"
      >
        {size.width > 0 && size.height > 0 ? (
          <>
            <button
              type="button"
              onClick={() => {
                onSelectAthlete(null);
                onHoverAthlete(null);
                resetView(graphRef.current, 260);
              }}
              className="absolute right-3 bottom-3 z-10 rounded-full border border-white/12 bg-[rgba(5,10,18,0.68)] px-3 py-2 text-[11px] tracking-[0.14em] text-[var(--text-secondary)] uppercase backdrop-blur-md transition hover:bg-[rgba(8,14,24,0.82)] sm:right-4 sm:bottom-4"
            >
              Reset view
            </button>

            <ForceGraph3D
              ref={graphRef}
              width={size.width}
              height={size.height}
              graphData={data}
              backgroundColor="rgba(0,0,0,0)"
              nodeId="id"
              nodeLabel={(node) => (node as ForceGraphNode).label}
              nodeColor={(node) =>
                resolveNodeColor(node as ForceGraphNode, focusState)
              }
              nodeVal={(node) =>
                resolveNodeVal(node as ForceGraphNode, focusState)
              }
              nodeRelSize={3}
              nodeOpacity={0.9}
              nodeResolution={8}
              linkColor={(link) =>
                resolveLinkColor(link as ForceGraphLink, focusState, data)
              }
              linkWidth={(link) =>
                resolveLinkWidth(link as ForceGraphLink, focusState, data)
              }
              linkOpacity={0.6}
              linkCurvature={(link) =>
                resolveLinkCurvature(link as ForceGraphLink, focusState)
              }
              warmupTicks={0}
              cooldownTicks={0}
              enableNodeDrag={false}
              showNavInfo={false}
              onNodeClick={(rawNode) => {
                const node = rawNode as ForceGraphNode;
                onSelectAthlete(node.id);
                flyToNode(graphRef.current, node);
              }}
              onNodeHover={(rawNode) =>
                onHoverAthlete(
                  rawNode ? (rawNode as ForceGraphNode).id : null,
                )
              }
              onBackgroundClick={() => {
                onSelectAthlete(null);
                onHoverAthlete(null);
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Focus state ────────────────────────────────────────────────────────────

function resolveLinkEndId(end: unknown): string {
  if (typeof end === 'string') return end;
  if (end && typeof end === 'object' && 'id' in end)
    return (end as ForceGraphNode).id;
  return '';
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
    const sourceId = resolveLinkEndId(link.source);
    const targetId = resolveLinkEndId(link.target);
    if (sourceId === focusId || targetId === focusId) {
      activeLinkIds.add(link.id);
      if (sourceId) activeNodeIds.add(sourceId);
      if (targetId) activeNodeIds.add(targetId);
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

// ─── Node styling ────────────────────────────────────────────────────────────

function resolveNodeColor(node: ForceGraphNode, focusState: FocusState): string {
  if (focusState.selectedId === node.id) return '#ffffff';
  if (!focusState.hasFocus) return node.color;
  if (focusState.activeNodeIds.has(node.id)) return node.color;
  return '#0f1520';
}

function resolveNodeVal(node: ForceGraphNode, focusState: FocusState): number {
  // nodeVal drives sphere volume: radius = cbrt(nodeVal) * nodeRelSize
  // node.size is a 2D radius (3.8–14); convert to equivalent 3D vol
  const base = Math.pow(node.size / 3, 3);
  if (!focusState.hasFocus) return base;
  if (focusState.selectedId === node.id) return base * 8; // 2× radius
  if (focusState.activeNodeIds.has(node.id)) return base * 2.2; // 1.3× radius
  return base * 0.064; // 0.4× radius
}

// ─── Link styling ────────────────────────────────────────────────────────────

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba('))
    return color.replace(/rgba\(([^)]+),\s*[\d.]+\)$/, `rgba($1, ${alpha})`);
  if (color.startsWith('hsla('))
    return color.replace(/hsla\(([^)]+),\s*[\d.]+\)$/, `hsla($1, ${alpha})`);
  return color;
}

function resolveLinkColor(
  link: ForceGraphLink,
  focusState: FocusState,
  data: ForceGraphData,
): string {
  if (!focusState.hasFocus) {
    const baseAlpha = data.meta.mode === 'era' ? 0.5 : 0.3;
    return withAlpha(link.color, baseAlpha);
  }
  if (focusState.activeLinkIds.has(link.id)) return withAlpha(link.color, 0.9);
  return 'rgba(88, 102, 126, 0.04)';
}

function resolveLinkWidth(
  link: ForceGraphLink,
  focusState: FocusState,
  data: ForceGraphData,
): number {
  if (!focusState.hasFocus)
    return data.meta.mode === 'rivalry'
      ? Math.max(0.6, link.width * 0.9)
      : Math.max(0.4, link.width * 0.7);
  return focusState.activeLinkIds.has(link.id) ? link.width + 1 : 0.05;
}

function resolveLinkCurvature(
  link: ForceGraphLink,
  focusState: FocusState,
): number {
  if (focusState.activeLinkIds.has(link.id)) return 0.2;
  return link.rivalryCount > 1 ? 0.15 : 0.05;
}

// ─── Camera ──────────────────────────────────────────────────────────────────

function flyToNode(
  graph: ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined,
  node: ForceGraphNode,
) {
  if (!graph || node.x == null || node.y == null) return;
  const nx = node.x;
  const ny = node.y;
  const nz = node.z ?? 0;
  const dist = Math.hypot(nx, ny, nz) || 1;
  const distRatio = 1 + 120 / dist;
  graph.cameraPosition(
    { x: nx * distRatio, y: ny * distRatio, z: nz * distRatio },
    { x: nx, y: ny, z: nz },
    800,
  );
}

function resetView(
  graph: ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined,
  durationMs: number,
) {
  if (!graph) return;
  graph.cameraPosition(
    { x: 0, y: 0, z: 700 },
    { x: 0, y: 0, z: 0 },
    durationMs,
  );
}
