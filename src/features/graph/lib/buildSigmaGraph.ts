import { DirectedGraph } from 'graphology';
import {
  SceneEdgeViewModel,
  SceneNodeViewModel,
} from '@/features/graph/lib/types';

export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  label: string;
  color: string;
  forceLabel: boolean;
}

export interface SigmaEdgeAttributes {
  size: number;
  color: string;
  hidden: boolean;
}

export function buildSigmaGraph(
  nodes: SceneNodeViewModel[],
  edges: SceneEdgeViewModel[],
): DirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes> {
  const graph = new DirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>();

  for (const node of nodes) {
    graph.addNode(node.id, {
      x: node.position.x / 100,
      y: node.position.y / 100,
      size: node.size,
      label: node.label,
      color: resolveNodeColor(node),
      forceLabel: node.activeMatches > 1,
    });
  }

  for (const edge of edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
      continue;
    }

    graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      size: edge.size,
      color: edge.color,
      hidden: false,
    });
  }

  return graph;
}

function resolveNodeColor(node: SceneNodeViewModel): string {
  if (node.bridgeScore >= 21) {
    return '#9ddbd3';
  }

  if (node.wins >= 2) {
    return '#7aa2ff';
  }

  return '#d7e6ff';
}
