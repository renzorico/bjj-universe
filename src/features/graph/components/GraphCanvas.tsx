import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
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

interface D3ForceHandle<Value = unknown> {
  strength?: (value: Value) => unknown;
  distance?: (value: Value) => unknown;
  radius?: (value: Value) => unknown;
  iterations?: (value: number) => unknown;
}

interface CameraViewState {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
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
  const initialViewRef = useRef<CameraViewState | null>(null);
  const hasCapturedInitialViewRef = useRef(false);
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
          typeof node.y !== 'number' ||
          typeof node.z !== 'number'
        ) {
          return null;
        }

        const rect = container.getBoundingClientRect();
        const screenPoint = graph.graph2ScreenCoords(node.x, node.y, node.z);

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
    }, 450);

    return () => {
      window.clearTimeout(readyTimer);
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, onSelectAthlete, size.height, size.width]);

  useEffect(() => {
    const graph = graphRef.current;

    if (!graph || data.nodes.length === 0) {
      return;
    }

    const chargeForce = graph.d3Force('charge') as
      | D3ForceHandle<(node: ForceGraphNode) => number>
      | undefined;
    const linkForce = graph.d3Force('link') as
      | D3ForceHandle<(link: ForceGraphLink) => number>
      | undefined;
    const collideForce = graph.d3Force('collide') as
      | D3ForceHandle<(node: ForceGraphNode) => number>
      | undefined;

    chargeForce?.strength?.(
      (node: ForceGraphNode) => -52 - node.importance * 2.2,
    );
    linkForce?.distance?.((link: ForceGraphLink) =>
      Math.max(28, 118 - link.rivalryCount * 10),
    );
    linkForce?.strength?.((link: ForceGraphLink) =>
      Math.min(0.28, 0.08 + link.rivalryCount * 0.045),
    );
    collideForce?.radius?.((node: ForceGraphNode) => node.size * 4.8);
    collideForce?.iterations?.(2);
    graph.d3ReheatSimulation();
  }, [data]);

  useEffect(() => {
    initialViewRef.current = null;
    hasCapturedInitialViewRef.current = false;
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
          const graph = graphRef.current;

          if (graph) {
            resetView(graph, initialViewRef.current);
          }
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
          <ForceGraph3D
            ref={graphRef}
            width={size.width}
            height={size.height}
            graphData={data}
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
            forceEngine="d3"
            numDimensions={3}
            nodeLabel={(node) => node.label}
            nodeRelSize={4}
            nodeResolution={12}
            nodeVal={(node) => node.size}
            nodeColor={(node) => resolveNodeColor(node, focusState)}
            linkColor={(link) => resolveLinkColor(link, focusState)}
            linkWidth={(link) => resolveLinkWidth(link, focusState)}
            linkOpacity={0.24}
            linkCurvature={(link) => resolveLinkCurvature(link, focusState)}
            linkResolution={10}
            linkDirectionalArrowLength={0}
            linkDirectionalParticles={(link) =>
              focusState.activeLinkIds.has(link.id) ? 2 : 0
            }
            linkDirectionalParticleWidth={1.6}
            linkDirectionalParticleSpeed={0.003}
            linkDirectionalParticleColor={(link) =>
              resolveLinkColor(link, focusState)
            }
            warmupTicks={90}
            cooldownTicks={140}
            d3AlphaDecay={0.035}
            d3VelocityDecay={0.22}
            enableNodeDrag={false}
            enableNavigationControls
            enablePointerInteraction
            showPointerCursor
            onNodeHover={(node) => onHoverAthlete(node?.id ?? null)}
            onNodeClick={(node) => onSelectAthlete(node.id)}
            onBackgroundClick={() => onSelectAthlete(null)}
            onEngineStop={() => {
              const graph = graphRef.current;

              if (!graph || hasCapturedInitialViewRef.current) {
                return;
              }

              const initialView = captureInitialView(graph);

              initialViewRef.current = initialView;
              hasCapturedInitialViewRef.current = true;
              graph.cameraPosition(initialView.position, initialView.lookAt, 0);
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

function resolveNodeColor(
  node: ForceGraphNode,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return withAlpha(node.color, 0.92);
  }

  if (focusState.activeNodeIds.has(node.id)) {
    return withAlpha(node.color, 0.98);
  }

  return 'rgba(102, 120, 154, 0.16)';
}

function resolveLinkColor(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return withAlpha(link.color, 0.34);
  }

  if (focusState.activeLinkIds.has(link.id)) {
    return withAlpha(link.color, 0.8);
  }

  return 'rgba(88, 102, 126, 0.06)';
}

function resolveLinkWidth(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return Math.max(0.4, link.width * 0.75);
  }

  return focusState.activeLinkIds.has(link.id) ? link.width + 0.35 : 0.12;
}

function resolveLinkCurvature(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (focusState.activeLinkIds.has(link.id)) {
    return 0.1;
  }

  return link.rivalryCount > 1 ? 0.08 : 0.03;
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
  initialView: CameraViewState | null,
) {
  if (!graph) {
    return;
  }

  const targetView = initialView ?? captureInitialView(graph);
  graph.cameraPosition(targetView.position, targetView.lookAt, 700);
}

function captureInitialView(
  graph: ForceGraphMethods<ForceGraphNode, ForceGraphLink>,
): CameraViewState {
  const bbox = graph.getGraphBbox();
  const center = {
    x: (bbox.x[0] + bbox.x[1]) / 2,
    y: (bbox.y[0] + bbox.y[1]) / 2,
    z: (bbox.z[0] + bbox.z[1]) / 2,
  };
  const span = Math.max(
    bbox.x[1] - bbox.x[0],
    bbox.y[1] - bbox.y[0],
    bbox.z[1] - bbox.z[0],
    160,
  );

  return {
    lookAt: center,
    position: {
      x: center.x,
      y: center.y + span * 0.12,
      z: center.z + span * 1.55,
    },
  };
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
