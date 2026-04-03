import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import {
  ForceGraphData,
  ForceGraphLink,
  ForceGraphNode,
} from '@/features/graph/lib/buildForceGraphData';
import { GRAPH_DESIGN_MODE } from '@/features/graph/config';

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
  const persistentLabelIds = useMemo(
    () => new Set(data.meta.labelNodeIds),
    [data.meta.labelNodeIds],
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
      selectNode: (nodeId: string | null) => {
        if (!GRAPH_DESIGN_MODE) {
          onSelectAthlete(nodeId);
        }
      },
      getNodeScreenPosition: (nodeId: string) => {
        if (GRAPH_DESIGN_MODE) {
          return null;
        }

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
    }, 120);

    return () => {
      window.clearTimeout(readyTimer);
      delete window.__BJJ_UNIVERSE_GRAPH__;
    };
  }, [nodeById, onSelectAthlete, size.height, size.width]);

  useEffect(() => {
    if (GRAPH_DESIGN_MODE || !graphRef.current || data.nodes.length === 0) {
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
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(122,162,255,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,_rgba(105,129,255,0.14),_transparent_30%),radial-gradient(circle_at_22%_18%,_rgba(95,225,197,0.08),_transparent_24%),linear-gradient(180deg,_rgba(4,10,17,0.18),_rgba(4,10,17,0.04))]" />

      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[520px] w-full"
      >
        {GRAPH_DESIGN_MODE ? (
          <StaticUniverseStage />
        ) : size.width > 0 && size.height > 0 ? (
          <>
            <button
              type="button"
              onClick={() => {
                onSelectAthlete(null);
                onHoverAthlete(null);
                resetView(graphRef.current, data, 260);
              }}
              className="absolute right-3 bottom-3 z-10 rounded-full border border-white/12 bg-[rgba(5,10,18,0.68)] px-3 py-2 text-[11px] tracking-[0.14em] text-[var(--text-secondary)] uppercase backdrop-blur-md transition hover:bg-[rgba(8,14,24,0.82)] sm:right-4 sm:bottom-4"
            >
              Reset view
            </button>

            <ForceGraph2D
              ref={graphRef}
              width={size.width}
              height={size.height}
              graphData={data}
              backgroundColor="rgba(0,0,0,0)"
              nodeLabel={() => ''}
              linkCurvature={(link) => resolveLinkCurvature(link, focusState)}
              linkColor={(link) => resolveLinkColor(link, focusState, data)}
              linkWidth={(link) => resolveLinkWidth(link, focusState, data)}
              nodePointerAreaPaint={paintNodePointerArea}
              nodeCanvasObject={(node, context, scale) =>
                drawNode(
                  node,
                  context,
                  scale,
                  focusState,
                  persistentLabelIds,
                  data.meta.mode,
                )
              }
              autoPauseRedraw={false}
              minZoom={0.42}
              maxZoom={7}
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
          </>
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
    return withAlpha(node.color, 0.9);
  }

  if (focusState.activeNodeIds.has(node.id)) {
    return withAlpha(node.color, focusState.hoveredId === node.id ? 1 : 0.98);
  }

  return 'rgba(88, 101, 124, 0.1)';
}

function resolveNodeSize(
  node: ForceGraphNode,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (!focusState.hasFocus) {
    return node.size;
  }

  if (focusState.selectedId === node.id) {
    return node.size * 2.15;
  }

  if (focusState.activeNodeIds.has(node.id)) {
    return node.size * 1.34;
  }

  return Math.max(1.1, node.size * 0.28);
}

function resolveLinkColor(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
  data: ForceGraphData,
) {
  if (!focusState.hasFocus) {
    const baseAlpha = data.meta.mode === 'era' ? 0.34 : 0.22;
    return withAlpha(link.color, baseAlpha);
  }

  if (focusState.activeLinkIds.has(link.id)) {
    return withAlpha(link.color, 0.94);
  }

  return 'rgba(88, 102, 126, 0.012)';
}

function resolveLinkWidth(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
  data: ForceGraphData,
) {
  if (!focusState.hasFocus) {
    return data.meta.mode === 'rivalry'
      ? Math.max(0.6, link.width * 0.9)
      : Math.max(0.45, link.width * 0.76);
  }

  return focusState.activeLinkIds.has(link.id) ? link.width + 1 : 0.06;
}

function resolveLinkCurvature(
  link: ForceGraphLink,
  focusState: ReturnType<typeof buildFocusState>,
) {
  if (focusState.activeLinkIds.has(link.id)) {
    return 0.16;
  }

  return link.rivalryCount > 1 ? 0.12 : 0.045;
}

function drawNode(
  node: ForceGraphNode,
  context: CanvasRenderingContext2D,
  globalScale: number,
  focusState: ReturnType<typeof buildFocusState>,
  persistentLabelIds: Set<string>,
  displayMode: ForceGraphData['meta']['mode'],
) {
  const radius = resolveNodeSize(node, focusState);
  const color = resolveNodeColor(node, focusState);
  const isSelected = focusState.selectedId === node.id;
  const isActiveNeighbor =
    focusState.hasFocus && !isSelected && focusState.activeNodeIds.has(node.id);
  const shouldShowLabel =
    isSelected ||
    focusState.hoveredId === node.id ||
    (!focusState.hasFocus && persistentLabelIds.has(node.id));

  context.save();

  if (isSelected) {
    context.beginPath();
    context.fillStyle = 'rgba(255,255,255,0.16)';
    context.shadowBlur = 40;
    context.shadowColor = 'rgba(255,255,255,0.6)';
    context.arc(node.x, node.y, radius + 9, 0, 2 * Math.PI, false);
    context.fill();
  } else if (isActiveNeighbor) {
    context.beginPath();
    context.fillStyle = withAlpha(node.color, 0.18);
    context.shadowBlur = 20;
    context.shadowColor = withAlpha(node.color, 0.55);
    context.arc(node.x, node.y, radius + 5.5, 0, 2 * Math.PI, false);
    context.fill();
  }

  context.beginPath();
  context.fillStyle = color;
  context.shadowBlur = isSelected
    ? 30
    : isActiveNeighbor
      ? 18
      : focusState.hasFocus
        ? 3
        : displayMode === 'era'
          ? 11
          : 8;
  context.shadowColor = color;
  context.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
  context.fill();

  context.beginPath();
  context.lineWidth = isSelected ? 2.8 : isActiveNeighbor ? 1.7 : 0.8;
  context.strokeStyle = isSelected
    ? 'rgba(255,255,255,0.84)'
    : isActiveNeighbor
      ? 'rgba(255,255,255,0.34)'
      : 'rgba(255,255,255,0.12)';
  context.arc(node.x, node.y, radius + 1.2, 0, 2 * Math.PI, false);
  context.stroke();
  context.restore();

  if (!shouldShowLabel) {
    return;
  }

  const fontSize = isSelected
    ? Math.max(12.5, 15 / globalScale)
    : Math.max(9.5, 11.5 / globalScale);
  const label = node.label;
  context.font = `${isSelected ? 700 : 600} ${fontSize}px "Inter", system-ui, sans-serif`;
  const textWidth = context.measureText(label).width;
  const textX = node.x + radius + 8;
  const textY = node.y - radius - 4;

  context.save();
  context.fillStyle = isSelected
    ? 'rgba(5, 10, 18, 0.94)'
    : 'rgba(5, 10, 18, 0.82)';
  context.strokeStyle = isSelected
    ? 'rgba(255,255,255,0.18)'
    : 'rgba(255,255,255,0.1)';
  roundRectPath(
    context,
    textX - 7,
    textY - fontSize - 4,
    textWidth + 14,
    fontSize + 10,
    8,
  );
  context.fill();
  context.stroke();
  context.lineWidth = 3.2;
  context.strokeStyle = 'rgba(5, 10, 18, 0.98)';
  context.strokeText(label, textX, textY);
  context.fillStyle = isSelected
    ? 'rgba(255,255,255,0.98)'
    : 'rgba(245, 248, 255, 0.94)';
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

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
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
  graph.zoom(0.96, durationMs);
  graph.zoomToFit(durationMs, 150);
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

function StaticUniverseStage() {
  return (
    <div
      data-testid="design-mode-stage"
      className="relative h-full min-h-[520px] w-full overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,_rgba(126,147,255,0.12),_transparent_20%),radial-gradient(circle_at_30%_42%,_rgba(80,227,194,0.08),_transparent_18%),radial-gradient(circle_at_68%_36%,_rgba(255,138,198,0.08),_transparent_14%)]" />
      <svg
        viewBox="0 0 1200 760"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="stageGlowA" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(122,162,255,0.35)" />
            <stop offset="100%" stopColor="rgba(122,162,255,0)" />
          </radialGradient>
          <radialGradient id="stageGlowB" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(80,227,194,0.28)" />
            <stop offset="100%" stopColor="rgba(80,227,194,0)" />
          </radialGradient>
          <radialGradient id="stageGlowC" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,138,198,0.26)" />
            <stop offset="100%" stopColor="rgba(255,138,198,0)" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="600" cy="380" rx="280" ry="220" fill="url(#stageGlowA)" />
        <ellipse cx="470" cy="430" rx="190" ry="150" fill="url(#stageGlowB)" />
        <ellipse cx="760" cy="300" rx="170" ry="120" fill="url(#stageGlowC)" />

        <g stroke="rgba(207,223,255,0.14)" strokeWidth="1.2" fill="none">
          <path d="M368 442C418 370 498 338 580 330" />
          <path d="M426 472C496 456 542 422 610 382" />
          <path d="M535 520C624 470 712 420 818 334" />
          <path d="M470 316C512 286 560 268 622 254" />
          <path d="M676 316C730 300 772 290 832 310" />
          <path d="M420 386C504 418 578 454 652 496" />
          <path d="M646 262C676 236 718 226 766 238" />
        </g>

        <g filter="url(#softGlow)">
          <StageCluster
            color="#ff8ac6"
            nodes={[
              [428, 332, 4],
              [452, 304, 5],
              [486, 332, 6],
              [512, 358, 5],
              [544, 326, 4],
              [520, 294, 5],
              [470, 362, 4],
              [564, 358, 3.5],
            ]}
          />
          <StageCluster
            color="#8de46b"
            nodes={[
              [438, 432, 4],
              [474, 456, 6],
              [506, 446, 4],
              [532, 418, 5],
              [564, 448, 4],
              [520, 486, 5],
              [470, 500, 4],
              [416, 472, 3.5],
            ]}
          />
          <StageCluster
            color="#ffd977"
            nodes={[
              [512, 538, 5],
              [556, 532, 4],
              [590, 506, 4],
              [622, 536, 6],
              [652, 504, 4],
              [604, 572, 4],
              [548, 582, 3.5],
            ]}
          />
          <StageCluster
            color="#86b7ff"
            nodes={[
              [748, 278, 5],
              [784, 300, 6],
              [820, 288, 4],
              [846, 322, 5],
              [804, 352, 4],
              [760, 340, 4],
              [726, 314, 3.5],
            ]}
          />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,_rgba(5,10,18,0),_rgba(5,10,18,0.55)_65%,_rgba(5,10,18,0.9))]" />
    </div>
  );
}

function StageCluster({
  color,
  nodes,
}: {
  color: string;
  nodes: Array<[number, number, number]>;
}) {
  return (
    <g>
      {nodes.map(([cx, cy, r], index) => (
        <g key={`${color}-${cx}-${cy}-${index}`}>
          <circle cx={cx} cy={cy} r={r * 2.6} fill={withAlpha(color, 0.08)} />
          <circle cx={cx} cy={cy} r={r} fill={color} />
        </g>
      ))}
    </g>
  );
}
