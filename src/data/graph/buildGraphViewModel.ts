import {
  GraphEdgeViewModel,
  GraphNodeViewModel,
  NormalizedCompetitionData,
} from '@/domain/types';
import { AthleteMetricsSnapshot } from '@/data/metrics/buildAthleteMetrics';

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
  const positionsByAthleteId = createStableNodePositions(normalized, metrics);
  const rivalryCounts = normalized.matches.reduce((registry, match) => {
    const rivalryId = [match.winnerId, match.loserId].sort().join('__');
    registry.set(rivalryId, (registry.get(rivalryId) ?? 0) + 1);
    return registry;
  }, new Map<string, number>());

  const nodes = normalized.athletes.map((athlete) => {
    const metric = metrics.athletes.get(athlete.id);
    const basePosition = positionsByAthleteId.get(athlete.id) ?? {
      x: 50,
      y: 50,
    };

    return {
      id: athlete.id,
      label: athlete.name,
      size: 16 + (metric?.wins ?? 0) * 4,
      wins: metric?.wins ?? 0,
      losses: metric?.losses ?? 0,
      yearsActive: metric?.yearsActive ?? [],
      sexes: athlete.sexes,
      weightClasses: athlete.weightClasses,
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
      sex: match.sex,
      weightClass: match.weightClass,
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

function createStableNodePositions(
  normalized: NormalizedCompetitionData,
  metrics: AthleteMetricsSnapshot,
): Map<string, { x: number; y: number }> {
  const sortedAthletes = [...normalized.athletes].sort((left, right) => {
    const leftMetric = metrics.athletes.get(left.id);
    const rightMetric = metrics.athletes.get(right.id);
    const bridgeDelta =
      (rightMetric?.bridgeScore ?? 0) - (leftMetric?.bridgeScore ?? 0);

    if (bridgeDelta !== 0) {
      return bridgeDelta;
    }

    const winDelta = (rightMetric?.wins ?? 0) - (leftMetric?.wins ?? 0);

    if (winDelta !== 0) {
      return winDelta;
    }

    return left.name.localeCompare(right.name);
  });

  if (sortedAthletes.length === 0) {
    return new Map();
  }

  if (sortedAthletes.length === 1) {
    return new Map([[sortedAthletes[0].id, { x: 50, y: 50 }]]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radiusLimit = 42;

  sortedAthletes.forEach((athlete, index) => {
    const radius = Math.sqrt(index / (sortedAthletes.length - 1)) * radiusLimit;
    const angle = index * goldenAngle;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.82;

    positions.set(athlete.id, {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    });
  });

  return positions;
}
