import {
  SceneEdgeViewModel,
  SceneNodeViewModel,
} from '@/features/graph/lib/types';

export interface ForceGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
  size: number;
  color: string;
  wins: number;
  bridgeScore: number;
  activeMatches: number;
}

export interface ForceGraphLink {
  id: string;
  source: string;
  target: string;
  color: string;
  width: number;
  rivalryCount: number;
  year: number;
  division: string;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

export function buildForceGraphData(
  nodes: SceneNodeViewModel[],
  edges: SceneEdgeViewModel[],
): ForceGraphData {
  return {
    nodes: nodes.map((node) => {
      const x = scalePosition(node.position.x, 50, 10);
      const y = scalePosition(node.position.y, 50, 8);

      return {
        id: node.id,
        label: node.label,
        x,
        y,
        fx: x,
        fy: y,
        size: clamp(node.size, 4, 18),
        color: resolveNodeColor(node),
        wins: node.wins,
        bridgeScore: node.bridgeScore,
        activeMatches: node.activeMatches,
      };
    }),
    links: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      color: edge.color,
      width: clamp(edge.size, 1, 5),
      rivalryCount: edge.rivalryCount,
      year: edge.year,
      division: edge.division,
    })),
  };
}

function scalePosition(value: number, origin: number, multiplier: number) {
  return Number(((value - origin) * multiplier).toFixed(3));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveNodeColor(node: SceneNodeViewModel) {
  if (node.bridgeScore >= 21) {
    return '#9ddbd3';
  }

  if (node.wins >= 2) {
    return '#7aa2ff';
  }

  return '#d7e6ff';
}
