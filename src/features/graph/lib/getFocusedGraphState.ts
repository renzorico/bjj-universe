import { MultiDirectedGraph } from 'graphology';
import {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from '@/features/graph/lib/buildSigmaGraph';

export interface FocusedGraphState {
  activeNodeIds: Set<string>;
  activeEdgeIds: Set<string>;
}

export function getFocusedGraphState(
  graph: MultiDirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>,
  selectedNodeId: string | null,
  hoveredNodeId: string | null,
): FocusedGraphState {
  const focalNodeId = selectedNodeId ?? hoveredNodeId;

  if (!focalNodeId || !graph.hasNode(focalNodeId)) {
    return {
      activeNodeIds: new Set(graph.nodes()),
      activeEdgeIds: new Set(graph.edges()),
    };
  }

  const activeNodeIds = new Set([focalNodeId, ...graph.neighbors(focalNodeId)]);
  const activeEdgeIds = new Set(graph.edges(focalNodeId));

  return {
    activeNodeIds,
    activeEdgeIds,
  };
}
