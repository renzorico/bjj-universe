import { MultiDirectedGraph } from 'graphology';
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
): MultiDirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes> {
  const graph = new MultiDirectedGraph<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  >();
  const normalizedPositions = normalizeNodePositions(nodes);

  for (const node of nodes) {
    const position = normalizedPositions.get(node.id);

    if (!position) {
      continue;
    }

    graph.addNode(node.id, {
      x: position.x,
      y: position.y,
      size: clamp(node.size, 8, 26),
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

function normalizeNodePositions(
  nodes: SceneNodeViewModel[],
): Map<string, { x: number; y: number }> {
  const validNodes = nodes.filter(
    (node) =>
      Number.isFinite(node.position.x) &&
      Number.isFinite(node.position.y) &&
      Number.isFinite(node.size),
  );

  if (validNodes.length === 0) {
    return new Map();
  }

  const xs = validNodes.map((node) => node.position.x);
  const ys = validNodes.map((node) => node.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return new Map(
    validNodes.map((node) => {
      const normalizedX = ((node.position.x - minX) / width) * 2 - 1;
      const normalizedY = ((node.position.y - minY) / height) * 2 - 1;

      return [
        node.id,
        {
          x: Number(normalizedX.toFixed(5)),
          y: Number(normalizedY.toFixed(5)),
        },
      ] as const;
    }),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
