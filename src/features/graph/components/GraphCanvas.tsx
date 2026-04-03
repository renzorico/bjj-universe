import { useEffect, useMemo, useRef, useState } from 'react';
import Sigma from 'sigma';
import { MultiDirectedGraph } from 'graphology';
import {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from '@/features/graph/lib/buildSigmaGraph';
import { getFocusedGraphState } from '@/features/graph/lib/getFocusedGraphState';

interface GraphCanvasProps {
  graph: MultiDirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>;
  selectedAthleteId: string | null;
  hoveredAthleteId: string | null;
  onSelectAthlete: (athleteId: string | null) => void;
  onHoverAthlete: (athleteId: string | null) => void;
}

export function GraphCanvas({
  graph,
  selectedAthleteId,
  hoveredAthleteId,
  onSelectAthlete,
  onHoverAthlete,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  > | null>(null);
  const [renderError, setRenderError] = useState(false);
  const focusStateRef = useRef(getFocusedGraphState(graph, null, null));
  const currentFocusState = useMemo(
    () => getFocusedGraphState(graph, selectedAthleteId, hoveredAthleteId),
    [graph, hoveredAthleteId, selectedAthleteId],
  );

  useEffect(() => {
    focusStateRef.current = currentFocusState;
  }, [currentFocusState]);

  const reducers = useMemo(
    () => ({
      nodeReducer: (nodeId: string, data: SigmaNodeAttributes) => {
        const active = focusStateRef.current.activeNodeIds.has(nodeId);
        const selected = selectedAthleteId === nodeId;
        const hovered = hoveredAthleteId === nodeId;

        return {
          ...data,
          color: active ? data.color : 'rgba(125, 147, 183, 0.18)',
          highlighted: selected || hovered,
          forceLabel: selected || hovered || data.forceLabel,
          zIndex: selected || hovered ? 3 : active ? 2 : 1,
        };
      },
      edgeReducer: (edgeId: string, data: SigmaEdgeAttributes) => {
        const active = focusStateRef.current.activeEdgeIds.has(edgeId);

        return {
          ...data,
          color: active ? data.color : 'rgba(125, 147, 183, 0.07)',
          hidden:
            !active &&
            (selectedAthleteId !== null || hoveredAthleteId !== null),
          zIndex: active ? 2 : 1,
        };
      },
    }),
    [hoveredAthleteId, selectedAthleteId],
  );

  useEffect(() => {
    if (graph.order === 0) {
      return undefined;
    }

    if (!containerRef.current) {
      return undefined;
    }

    try {
      let renderStateTimeout: number | null = null;
      const sigma = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: true,
        defaultEdgeColor: 'rgba(157, 219, 211, 0.22)',
        defaultNodeColor: '#7aa2ff',
        enableEdgeEvents: false,
        hideEdgesOnMove: false,
        itemSizesReference: 'positions',
        labelDensity: 0.06,
        labelRenderedSizeThreshold: 14,
        labelColor: { color: '#dce9ff' },
        labelFont: 'Space Grotesk',
        minCameraRatio: 0.25,
        maxCameraRatio: 6,
        nodeReducer: reducers.nodeReducer,
        edgeReducer: reducers.edgeReducer,
        renderEdgeLabels: false,
        renderLabels: true,
        stagePadding: 48,
        zIndex: true,
      });

      sigma.on('clickNode', ({ node }) => onSelectAthlete(node));
      sigma.on('clickStage', () => onSelectAthlete(null));
      sigma.on('enterNode', ({ node }) => onHoverAthlete(node));
      sigma.on('leaveNode', () => onHoverAthlete(null));
      void sigma.getCamera().animatedReset({ duration: 0 });

      sigmaRef.current = sigma;
      renderStateTimeout = window.setTimeout(() => setRenderError(false), 0);

      const animationFrame = window.requestAnimationFrame(() => {
        sigma.refresh();
        void sigma.getCamera().animatedReset({ duration: 0 });
      });
      const resizeObserver = new ResizeObserver(() => {
        sigma.refresh();
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        if (renderStateTimeout !== null) {
          window.clearTimeout(renderStateTimeout);
        }
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        sigma.kill();
        sigmaRef.current = null;
      };
    } catch {
      const renderStateTimeout = window.setTimeout(
        () => setRenderError(true),
        0,
      );
      sigmaRef.current = null;
      return () => {
        window.clearTimeout(renderStateTimeout);
      };
    }

    return () => {
      sigmaRef.current?.kill();
      sigmaRef.current = null;
    };
  }, [
    graph,
    onHoverAthlete,
    onSelectAthlete,
    reducers.edgeReducer,
    reducers.nodeReducer,
  ]);

  useEffect(() => {
    const sigma = sigmaRef.current;

    if (!sigma) {
      return;
    }

    sigma.refresh();
  }, [currentFocusState, graph]);

  if (graph.order === 0) {
    return renderFallback(
      'No matches in view',
      'Adjust the year or division filters to restore athletes and observed match connections.',
    );
  }

  if (renderError) {
    return renderFallback(
      'Graph unavailable',
      'The graph renderer could not initialize from the current dataset. Clear the filters or reload to retry.',
    );
  }

  return (
    <div className="relative h-full min-h-[440px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(122,162,255,0.16),_transparent_46%)]" />
      <div
        ref={containerRef}
        aria-label="Interactive athlete graph"
        className="h-full min-h-[440px] w-full"
      />
    </div>
  );
}

function renderFallback(title: string, description: string) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 text-center">
      <div>
        <p className="font-display text-2xl text-white">{title}</p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
