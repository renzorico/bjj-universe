import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { ForceGraphMethods } from 'react-force-graph-3d';
import {
  ForceGraphData,
  ForceGraphLink,
  ForceGraphNode,
} from '@/features/graph/lib/buildForceGraphData';

interface GraphCanvasProps {
  data: ForceGraphData;
  introToken: number;
  selectedAthleteId: string | null;
  hoveredAthleteId: string | null;
  pathNodeIds: string[];
  pathEdgeIds: string[];
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
  introToken,
  selectedAthleteId,
  hoveredAthleteId,
  pathNodeIds,
  pathEdgeIds,
  onSelectAthlete,
  onHoverAthlete,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >(undefined);
  const introRafRef = useRef<number | null>(null);
  const introDelayRef = useRef<number | null>(null);
  const introActiveRef = useRef(false);
  const lastIntroTokenRef = useRef(0);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const stopIntroMotion = useCallback(() => {
    if (introDelayRef.current !== null) {
      window.clearTimeout(introDelayRef.current);
      introDelayRef.current = null;
    }

    if (introRafRef.current !== null) {
      window.cancelAnimationFrame(introRafRef.current);
      introRafRef.current = null;
    }

    introActiveRef.current = false;
  }, []);

  const nodeById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node] as const)),
    [data.nodes],
  );

  const focusState = useMemo(
    () =>
      buildFocusState(
        data,
        selectedAthleteId,
        hoveredAthleteId,
        pathNodeIds,
        pathEdgeIds,
      ),
    [data, selectedAthleteId, hoveredAthleteId, pathNodeIds, pathEdgeIds],
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

  // One-shot intro motion for Home -> Universe entry.
  useEffect(() => {
    if (introToken <= 0 || introToken === lastIntroTokenRef.current) {
      return undefined;
    }

    if (!graphRef.current || size.width <= 0 || size.height <= 0) {
      return undefined;
    }

    lastIntroTokenRef.current = introToken;
    stopIntroMotion();

    const graph = graphRef.current;
    const durationMs = 3000;
    const restRadius = 700;
    const startRadius = 1180;
    const startHeight = 150;
    const endHeight = 0;
    const startDelayMs = 90;
    const thetaStart = -0.34;
    const thetaTravel = Math.PI * 2 * 4 + 0.34;
    let startedAt = 0;

    const animate = (now: number) => {
      if (!introActiveRef.current) {
        return;
      }

      if (startedAt === 0) {
        startedAt = now;
      }

      const elapsed = now - startedAt;
      const t = Math.min(elapsed / durationMs, 1);

      // Keep rotational momentum for most of the timeline, then taper to rest.
      const spinProgress = 1 - Math.pow(1 - t, 0.78);
      // Ease camera inward from depth toward normal resting distance.
      const approachProgress = 1 - Math.pow(1 - t, 2.2);

      const theta = thetaStart + thetaTravel * spinProgress;
      const radius = startRadius + (restRadius - startRadius) * approachProgress;
      const baseHeight =
        startHeight + (endHeight - startHeight) * approachProgress;
      const verticalArc =
        Math.sin(theta * 0.55 + 0.4) * 28 * Math.pow(1 - t, 0.7);

      graph.cameraPosition(
        {
          x: Math.sin(theta) * radius,
          y: baseHeight + verticalArc,
          z: Math.cos(theta) * radius,
        },
        { x: 0, y: 0, z: 0 },
        0,
      );

      if (t >= 1) {
        introActiveRef.current = false;
        introRafRef.current = null;
        return;
      }

      introRafRef.current = window.requestAnimationFrame(animate);
    };

    introDelayRef.current = window.setTimeout(() => {
      introDelayRef.current = null;
      introActiveRef.current = true;
      introRafRef.current = window.requestAnimationFrame(animate);
    }, startDelayMs);

    return () => {
      stopIntroMotion();
    };
  }, [introToken, size.width, size.height, stopIntroMotion]);

  // If the user engages with the scene during intro, cancel gracefully.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const cancelOnUserIntent = () => {
      if (introActiveRef.current || introDelayRef.current !== null) {
        stopIntroMotion();
      }
    };

    container.addEventListener('pointerdown', cancelOnUserIntent);
    container.addEventListener('wheel', cancelOnUserIntent, { passive: true });
    container.addEventListener('touchstart', cancelOnUserIntent, {
      passive: true,
    });

    return () => {
      container.removeEventListener('pointerdown', cancelOnUserIntent);
      container.removeEventListener('wheel', cancelOnUserIntent);
      container.removeEventListener('touchstart', cancelOnUserIntent);
    };
  }, [stopIntroMotion]);

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
      <div className="flex h-full w-full items-center justify-center text-center">
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
    <div
      ref={containerRef}
      aria-label="Interactive athlete graph"
      className="relative h-full min-h-[520px] w-full"
    >
      {/* Subtle radial depth haze — drawn over the canvas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_46%,rgba(105,129,255,0.1),transparent_55%),radial-gradient(ellipse_30%_25%_at_18%_16%,rgba(84,219,199,0.06),transparent_55%)]" />

      {size.width > 0 && size.height > 0 ? (
        <>
          {isGuideOpen ? (
            <aside
              id="graph-guide-panel"
              className="absolute bottom-12 right-4 z-10 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[4px] border border-white/[0.1] bg-[rgba(4,9,17,0.9)] p-3 shadow-[0_18px_38px_rgba(0,0,0,0.4)] backdrop-blur-md sm:bottom-14 sm:right-5"
              style={{ maxHeight: 'min(28rem, calc(100vh - 6rem))' }}
            >
              <h3 className="mb-2 text-[9px] tracking-[0.2em] text-white/50 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Guide
              </h3>
              <p className="mb-3 text-[10.5px] leading-[1.5] text-white/58">
                BJJ Universe is an interactive map of ADCC and Brazilian Jiu-Jitsu athletes. Each node is an athlete, and connections between nodes come from real match relationships in the dataset.
              </p>
              <div className="space-y-2.5">
                <div>
                  <p className="mb-1 text-[9px] tracking-[0.15em] text-white/40 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>What you are looking at</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-[1.45] text-white/58">
                    <li>The graph shows athletes as a network instead of a list.</li>
                    <li>Athletes that are more connected appear closer inside the graph structure.</li>
                    <li>The view changes depending on the filters you apply.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-[9px] tracking-[0.15em] text-white/40 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>How to explore</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-[1.45] text-white/58">
                    <li>Drag to move the view.</li>
                    <li>Scroll or pinch to zoom.</li>
                    <li>Click an athlete to open their details.</li>
                    <li>Use the controls to filter the graph by the available categories.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-[9px] tracking-[0.15em] text-white/40 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Main features</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-[1.45] text-white/58">
                    <li>Search helps you find a specific athlete quickly.</li>
                    <li>Filters reduce the graph to a more relevant subset.</li>
                    <li>Closest path shows the shortest connection chain between two athletes in the current graph view.</li>
                    <li>Reset view recenters the graph if you get lost.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-[9px] tracking-[0.15em] text-white/40 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Important note</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-[1.45] text-white/58">
                    <li>Paths and visible athletes depend on the filters that are currently active.</li>
                    <li>If an athlete is missing, broaden or clear the filters.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-[9px] tracking-[0.15em] text-white/40 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Tips</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-[1.45] text-white/58">
                    <li>Start by searching for one athlete you know.</li>
                    <li>Then open their details and explore nearby connections.</li>
                    <li>Use Closest path when you want to understand how two athletes are linked.</li>
                  </ul>
                </div>
              </div>
            </aside>
          ) : null}

          {/* Centered credit — matches LandingPage capsule style */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center sm:bottom-5">
            <a
              href="https://www.linkedin.com/in/renzorico"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] tracking-[0.24em] text-[var(--text-dim)] uppercase transition-colors duration-200 hover:text-[color:var(--text-secondary)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Made by Renzo Rico
            </a>
          </div>

          {/* Guide + Reset view buttons */}
          <div className="hud-panel absolute bottom-4 right-4 z-10 flex items-center gap-1 p-1.5 sm:bottom-5 sm:right-5">
            <button
              type="button"
              aria-expanded={isGuideOpen}
              aria-controls="graph-guide-panel"
              className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-2 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
              onClick={() => setIsGuideOpen((current) => !current)}
            >
              Guide
            </button>
            <button
              type="button"
              onClick={() => {
                stopIntroMotion();
                onSelectAthlete(null);
                onHoverAthlete(null);
                resetView(graphRef.current, 260);
              }}
              className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-2 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
            >
              Reset view
            </button>
          </div>

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
              stopIntroMotion();
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
              stopIntroMotion();
              onSelectAthlete(null);
              onHoverAthlete(null);
            }}
          />
        </>
      ) : null}
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
  pathNodeIds: string[],
  pathEdgeIds: string[],
) {
  const pathNodeIdSet = new Set(pathNodeIds);
  const pathEdgeIdSet = new Set(pathEdgeIds);
  const hasPath = pathNodeIdSet.size > 0;

  if (hasPath) {
    return {
      activeNodeIds: new Set<string>(),
      activeLinkIds: new Set<string>(),
      hasFocus: false,
      selectedId: selectedAthleteId,
      hoveredId: hoveredAthleteId,
      hasPath: true,
      pathNodeIds: pathNodeIdSet,
      pathEdgeIds: pathEdgeIdSet,
      pathStartId: pathNodeIds[0] ?? null,
      pathEndId: pathNodeIds[pathNodeIds.length - 1] ?? null,
    };
  }

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
      hasPath: false,
      pathNodeIds: pathNodeIdSet,
      pathEdgeIds: pathEdgeIdSet,
      pathStartId: null,
      pathEndId: null,
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
    hasPath: false,
    pathNodeIds: pathNodeIdSet,
    pathEdgeIds: pathEdgeIdSet,
    pathStartId: null,
    pathEndId: null,
  };
}

// ─── Node styling ────────────────────────────────────────────────────────────

function resolveNodeColor(node: ForceGraphNode, focusState: FocusState): string {
  if (focusState.hasPath) {
    if (focusState.pathStartId === node.id || focusState.pathEndId === node.id) {
      return '#ffffff';
    }
    if (focusState.pathNodeIds.has(node.id)) {
      return node.color;
    }
    return '#090c10';
  }

  if (focusState.selectedId === node.id) return '#ffffff';
  if (!focusState.hasFocus) return node.color;
  if (focusState.activeNodeIds.has(node.id)) return node.color;
  return '#0f1520';
}

function resolveNodeVal(node: ForceGraphNode, focusState: FocusState): number {
  // nodeVal drives sphere volume: radius = cbrt(nodeVal) * nodeRelSize
  // node.size is a 2D radius (3.8–14); convert to equivalent 3D vol
  const base = Math.pow(node.size / 3, 3);
  if (focusState.hasPath) {
    if (focusState.pathStartId === node.id || focusState.pathEndId === node.id) {
      return base * 6;
    }
    if (focusState.pathNodeIds.has(node.id)) {
      return base * 2.2;
    }
    return base * 0.04;
  }

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
  if (focusState.hasPath) {
    if (focusState.pathEdgeIds.has(link.id)) return withAlpha(link.color, 0.95);
    return 'rgba(88, 102, 126, 0.03)';
  }

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
  if (focusState.hasPath) {
    return focusState.pathEdgeIds.has(link.id) ? link.width + 1 : 0.03;
  }

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
  if (focusState.hasPath) {
    return focusState.pathEdgeIds.has(link.id) ? 0.2 : 0.03;
  }

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
