import { useEffect, useMemo, useRef } from 'react';
import Sigma from 'sigma';
import { DirectedGraph } from 'graphology';
import {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from '@/features/graph/lib/buildSigmaGraph';
import { getFocusedGraphState } from '@/features/graph/lib/getFocusedGraphState';

interface GraphCanvasProps {
  graph: DirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>;
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
    if (!containerRef.current) {
      return undefined;
    }

    const sigma = new Sigma(graph, containerRef.current, {
      allowInvalidContainer: true,
      defaultEdgeColor: 'rgba(157, 219, 211, 0.22)',
      defaultNodeColor: '#7aa2ff',
      enableEdgeEvents: false,
      hideEdgesOnMove: false,
      itemSizesReference: 'positions',
      labelDensity: 0.08,
      labelRenderedSizeThreshold: 10,
      labelColor: { color: '#dce9ff' },
      labelFont: 'Space Grotesk',
      nodeReducer: reducers.nodeReducer,
      edgeReducer: reducers.edgeReducer,
      renderEdgeLabels: false,
      renderLabels: true,
      stagePadding: 32,
      zIndex: true,
    });

    sigma.on('clickNode', ({ node }) => onSelectAthlete(node));
    sigma.on('clickStage', () => onSelectAthlete(null));
    sigma.on('enterNode', ({ node }) => onHoverAthlete(node));
    sigma.on('leaveNode', () => onHoverAthlete(null));

    sigmaRef.current = sigma;

    return () => {
      sigma.kill();
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
    sigmaRef.current?.refresh();
  }, [currentFocusState, graph]);

  if (graph.order === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 text-center">
        <div>
          <p className="font-display text-2xl text-white">No matches in view</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            Adjust the year or division filters to restore athletes and observed
            match connections.
          </p>
        </div>
      </div>
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
