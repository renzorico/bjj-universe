import {
  GraphEdgeViewModel,
  GraphNodeViewModel,
  NormalizedCompetitionData,
} from '@/domain/types';
import { AthleteMetricsSnapshot } from '@/data/metrics/buildAthleteMetrics';

const positions = [
  { x: 18, y: 22 },
  { x: 42, y: 30 },
  { x: 68, y: 20 },
  { x: 77, y: 54 },
  { x: 58, y: 74 },
  { x: 27, y: 70 },
  { x: 12, y: 50 },
];

export function buildGraphViewModel(
  normalized: NormalizedCompetitionData,
  metrics: AthleteMetricsSnapshot,
): {
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
} {
  const nodes = normalized.athletes.map((athlete, index) => {
    const metric = metrics.athletes.get(athlete.id);
    const basePosition = positions[index % positions.length];

    return {
      id: athlete.id,
      label: athlete.name,
      size: 16 + (metric?.wins ?? 0) * 4,
      position: basePosition,
    };
  });

  const nodePositions = new Map(
    nodes.map((node) => [node.id, node.position] as const),
  );

  const edges = normalized.matches.map((match, index) => {
    const sourcePosition = nodePositions.get(match.winnerId) ?? { x: 0, y: 0 };
    const targetPosition = nodePositions.get(match.loserId) ?? { x: 0, y: 0 };
    const deltaX = targetPosition.x - sourcePosition.x;
    const deltaY = targetPosition.y - sourcePosition.y;

    return {
      id: `edge_${index + 1}`,
      source: match.winnerId,
      target: match.loserId,
      weight: 1,
      sourcePosition,
      targetPosition,
      angle: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
      length: Math.sqrt(deltaX ** 2 + deltaY ** 2),
    };
  });

  return {
    nodes,
    edges,
  };
}
