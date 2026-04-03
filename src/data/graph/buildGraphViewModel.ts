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
  const eventById = new Map(
    normalized.events.map((event) => [event.id, event]),
  );
  const rivalryCounts = normalized.matches.reduce((registry, match) => {
    const rivalryId = [match.winnerId, match.loserId].sort().join('__');
    registry.set(rivalryId, (registry.get(rivalryId) ?? 0) + 1);
    return registry;
  }, new Map<string, number>());

  const nodes = normalized.athletes.map((athlete, index) => {
    const metric = metrics.athletes.get(athlete.id);
    const basePosition = positions[index % positions.length];

    return {
      id: athlete.id,
      label: athlete.name,
      size: 16 + (metric?.wins ?? 0) * 4,
      wins: metric?.wins ?? 0,
      losses: metric?.losses ?? 0,
      yearsActive: metric?.yearsActive ?? [],
      divisions: athlete.divisions,
      nationality: athlete.nationality,
      team: athlete.team,
      bridgeScore: metric?.bridgeScore ?? 0,
      position: basePosition,
    };
  });

  const nodePositions = new Map(
    nodes.map((node) => [node.id, node.position] as const),
  );

  const edges = normalized.matches.map((match, index) => {
    const sourcePosition = nodePositions.get(match.winnerId) ?? { x: 0, y: 0 };
    const targetPosition = nodePositions.get(match.loserId) ?? { x: 0, y: 0 };
    const event = eventById.get(match.eventId);
    const rivalryId = [match.winnerId, match.loserId].sort().join('__');
    const deltaX = targetPosition.x - sourcePosition.x;
    const deltaY = targetPosition.y - sourcePosition.y;

    return {
      id: `edge_${index + 1}`,
      source: match.winnerId,
      target: match.loserId,
      weight: 1,
      eventId: match.eventId,
      eventName: event?.name ?? 'Unknown event',
      year: event?.year ?? 0,
      division: match.division,
      method: match.method,
      roundLabel: match.roundLabel,
      rivalryId,
      rivalryCount: rivalryCounts.get(rivalryId) ?? 1,
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
