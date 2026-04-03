import {
  ComponentType,
  MouseEvent,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  ready: boolean;
  getNodeScreenPosition: (nodeId: string) => { x: number; y: number } | null;
  selectNode: (nodeId: string | null) => void;
}

declare global {
  interface Window {
    __BJJ_UNIVERSE_GRAPH__?: GraphTestApi;
  }
}

interface ForceGraphRendererProps {
  ref?: MutableRefObject<unknown>;
  width: number;
  height: number;
  graphData: ForceGraphData;
  cooldownTicks: number;
  d3AlphaDecay: number;
  minZoom: number;
  maxZoom: number;
  enableNodeDrag: boolean;
  enablePanInteraction: boolean;
  enableZoomInteraction: boolean;
  backgroundColor: string;
  linkDirectionalParticles: number;
  nodeRelSize: number;
  linkCurvature: (link: ForceGraphLink) => number;
  nodePointerAreaPaint: (
    node: object,
    color: string,
    context: CanvasRenderingContext2D,
  ) => void;
  linkWidth: (link: ForceGraphLink) => number;
  linkColor: (link: ForceGraphLink) => string;
  linkDirectionalArrowLength: number;
  linkDirectionalArrowRelPos: number;
  linkDirectionalArrowColor: (link: ForceGraphLink) => string;
  onBackgroundClick?: () => void;
  onNodeHover?: (node: ForceGraphNode | null) => void;
  onNodeClick?: (node: ForceGraphNode) => void;
  onEngineStop: () => void;
  nodeCanvasObject: (
    node: ForceGraphNode,
    context: CanvasRenderingContext2D,
  ) => void;
}

const ForceGraph2DShim =
  ForceGraph2D as unknown as ComponentType<ForceGraphRendererProps>;

export function GraphCanvas({
  data,
  selectedAthleteId,
  hoveredAthleteId,
  onSelectAthlete,
  onHoverAthlete,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<unknown>(null);
  const renderedNodePositionsRef = useRef<
    Map<string, { x: number; y: number }>
  >(new Map());
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
        const renderedPosition = renderedNodePositionsRef.current.get(nodeId);
        const graph = graphRef.current as {
          graph2ScreenCoords?: (
            x: number,
            y: number,
          ) => { x: number; y: number };
        } | null;

        if (!renderedPosition || !graph) {
          return null;
        }

        const rect = container.getBoundingClientRect();
        const screenPoint = graph.graph2ScreenCoords?.(
          renderedPosition.x,
          renderedPosition.y,
        );

        if (!screenPoint) {
          return null;
        }

        return {
          x: rect.left + screenPoint.x,
          y: rect.top + screenPoint.y,
        };
      },
    };

    return () => {
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, onSelectAthlete, size.height, size.width]);

  useEffect(() => {
    const graph = graphRef.current as {
      d3Force?: (name: string) => {
        strength?: (value: unknown) => unknown;
        distance?: (value: unknown) => unknown;
        iterations?: (value: number) => unknown;
        radius?: (value: unknown) => unknown;
        x?: (value: unknown) => unknown;
        y?: (value: unknown) => unknown;
      } | null;
    } | null;

    if (!graph || data.nodes.length === 0) {
      return;
    }

    graph
      .d3Force?.('charge')
      ?.strength?.((node: ForceGraphNode) => -42 - node.importance * 1.8);
    graph
      .d3Force?.('link')
      ?.distance?.((link: ForceGraphLink) =>
        Math.max(24, 92 - link.rivalryCount * 12),
      );
    graph
      .d3Force?.('link')
      ?.strength?.((link: ForceGraphLink) =>
        Math.min(0.32, 0.1 + link.rivalryCount * 0.05),
      );
    graph.d3Force?.('center')?.x?.(0);
    graph.d3Force?.('center')?.y?.(0);
    graph
      .d3Force?.('collide')
      ?.radius?.((node: ForceGraphNode) => node.size + 6);
    graph.d3Force?.('collide')?.iterations?.(2);
  }, [data, size.height, size.width]);

  useEffect(() => {
    const graph = graphRef.current as {
      centerAt?: (x?: number, y?: number, ms?: number) => void;
      zoom?: (scale: number, ms?: number) => void;
      zoomToFit?: (ms?: number, padding?: number) => void;
    } | null;

    if (!graph) {
      return;
    }

    if (!selectedAthleteId) {
      graph.zoomToFit?.(450, 90);
      return;
    }

    const selectedNode = nodeById.get(selectedAthleteId);

    if (!selectedNode) {
      return;
    }

    graph.centerAt?.(selectedNode.x, selectedNode.y, 450);
    graph.zoom?.(2.1, 450);
  }, [nodeById, selectedAthleteId]);

  if (data.nodes.length === 0 || data.links.length === 0) {
    return renderFallback(
      'No matches in view',
      'Adjust the year or division filters to restore athletes and observed match connections.',
    );
  }

  const handleGraphClick = (event: MouseEvent<HTMLDivElement>) => {
    const graph = graphRef.current as {
      graph2ScreenCoords?: (x: number, y: number) => { x: number; y: number };
    } | null;

    if (!graph?.graph2ScreenCoords) {
      onSelectAthlete(null);
      return;
    }

    let closestNodeId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const node of data.nodes) {
      const renderedPosition = renderedNodePositionsRef.current.get(node.id);

      if (!renderedPosition) {
        continue;
      }

      const screenPoint = graph.graph2ScreenCoords(
        renderedPosition.x,
        renderedPosition.y,
      );
      const deltaX = screenPoint.x - event.nativeEvent.offsetX;
      const deltaY = screenPoint.y - event.nativeEvent.offsetY;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const hitRadius = node.size + 12;

      if (distance <= hitRadius && distance < closestDistance) {
        closestDistance = distance;
        closestNodeId = node.id;
      }
    }

    onSelectAthlete(closestNodeId);
  };

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(122,162,255,0.16),_transparent_34%),radial-gradient(circle_at_20%_15%,_rgba(95,225,197,0.12),_transparent_28%)]" />
      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[520px] w-full"
        onClick={handleGraphClick}
      >
        {size.width > 0 && size.height > 0 ? (
          <ForceGraph2DShim
            ref={graphRef as MutableRefObject<unknown>}
            width={size.width}
            height={size.height}
            graphData={data}
            cooldownTicks={140}
            d3AlphaDecay={0.04}
            minZoom={0.55}
            maxZoom={6}
            enableNodeDrag={false}
            enablePanInteraction
            enableZoomInteraction
            backgroundColor="rgba(0,0,0,0)"
            linkDirectionalParticles={0}
            nodeRelSize={1}
            linkCurvature={(link: ForceGraphLink) =>
              resolveLinkCurvature(link, focusState)
            }
            nodePointerAreaPaint={paintNodePointerArea}
            linkWidth={(link: ForceGraphLink) =>
              resolveLinkWidth(link, focusState)
            }
            linkColor={(link: ForceGraphLink) =>
              resolveLinkColor(link, focusState)
            }
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={(link: ForceGraphLink) =>
              resolveLinkColor(link, focusState)
            }
            onNodeHover={(node: ForceGraphNode | null) =>
              onHoverAthlete(node?.id ?? null)
            }
            onEngineStop={() =>
              (() => {
                (
                  graphRef.current as {
                    zoomToFit?: (ms?: number, padding?: number) => void;
                  } | null
                )?.zoomToFit?.(400, 90);

                if (window.__BJJ_UNIVERSE_GRAPH__) {
                  window.__BJJ_UNIVERSE_GRAPH__.ready = true;
                }
              })()
            }
            nodeCanvasObject={(
              node: ForceGraphNode,
              context: CanvasRenderingContext2D,
            ) => {
              renderedNodePositionsRef.current.set(node.id, {
                x: node.x,
                y: node.y,
              });

              paintNode(
                node,
                context,
                focusState,
                selectedAthleteId,
                hoveredAthleteId,
              );
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
    return Math.max(0.55, link.width * 0.8);
  }

  return focusState.activeLinkIds.has(link.id) ? link.width + 0.6 : 0.4;
}

function resolveLinkCurvature(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (focusState.activeLinkIds.has(link.id)) {
    return 0.16;
  }

  return link.rivalryCount > 1 ? 0.12 : 0.04;
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
  const baseFill = active ? node.color : 'rgba(125, 147, 183, 0.2)';

  context.beginPath();
  context.arc(node.x, node.y, radius, 0, Math.PI * 2, false);
  context.shadowColor = active ? withAlpha(baseFill, 0.8) : 'transparent';
  context.shadowBlur = selected
    ? 26
    : hovered
      ? 18
      : node.importance >= 16
        ? 14
        : 8;
  context.fillStyle = baseFill;
  context.fill();
  context.shadowBlur = 0;

  context.beginPath();
  context.arc(
    node.x,
    node.y,
    Math.max(1.3, radius * 0.42),
    0,
    Math.PI * 2,
    false,
  );
  context.fillStyle = 'rgba(255,255,255,0.66)';
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

  if (selected || hovered || node.importance >= 16) {
    context.font = selected ? '600 13px Space Grotesk' : '12px Space Grotesk';
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
    graphNode.size + 14,
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
