import {
  AdccAthlete,
  CanonicalAdccMatch,
  GraphEdgeViewModel,
  GraphNodeViewModel,
} from '@/domain/types';
import { CanonicalAthleteMetricsSnapshot } from '@/data/metrics/buildCanonicalAthleteMetrics';

export function buildGraphViewModel(
  athletes: AdccAthlete[],
  matches: CanonicalAdccMatch[],
  metrics: CanonicalAthleteMetricsSnapshot,
  adccAthletes: AdccAthlete[],
): {
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
} {
  const athleteMetadata = buildAthleteMetadataIndex(adccAthletes);
  const positionsByAthleteId = createStableNodePositions(athletes, metrics);
  const rivalryCounts = matches.reduce((registry, match) => {
    const rivalryId = [match.winnerCanonicalId, match.loserCanonicalId]
      .sort()
      .join('__');
    registry.set(rivalryId, (registry.get(rivalryId) ?? 0) + 1);
    return registry;
  }, new Map<string, number>());
  const athleteIds = new Set(
    athletes.map((athlete) => athlete.canonicalAthleteId),
  );

  const nodes = athletes.map((athlete) => {
    const metric = metrics.athletes.get(athlete.canonicalAthleteId);
    const metadata = resolveAthleteMetadata(athlete, athleteMetadata);
    const basePosition =
      positionsByAthleteId.get(athlete.canonicalAthleteId) ?? {
        x: 50,
        y: 50,
      };

    return {
      id: athlete.canonicalAthleteId,
      label: metadata.name,
      displaySex: metadata.sex,
      displayPrimaryWeightClass: metadata.primaryWeightClass,
      displayActiveYearFirst: metadata.activeYearFirst,
      displayActiveYearLast: metadata.activeYearLast,
      displayTotalMatches: metadata.totalMatches,
      size: 16 + (metric?.wins ?? 0) * 4,
      wins: metric?.wins ?? 0,
      losses: metric?.losses ?? 0,
      yearsActive: metric?.yearsActive ?? [],
      sexes: metadata.sex ? [metadata.sex] : [],
      weightClasses: metadata.primaryWeightClass
        ? [metadata.primaryWeightClass]
        : [],
      nationality: metadata.nationality ?? undefined,
      team: metadata.team ?? undefined,
      bridgeScore: metric?.bridgeScore ?? 0,
      position: basePosition,
    };
  });

  const nodePositions = new Map(
    nodes.map((node) => [node.id, node.position] as const),
  );

  const edges = matches
    .filter(
      (match) =>
        athleteIds.has(match.winnerCanonicalId) &&
        athleteIds.has(match.loserCanonicalId),
    )
    .map((match, index) => {
      const sourcePosition = nodePositions.get(match.winnerCanonicalId) ?? {
        x: 0,
        y: 0,
      };
      const targetPosition = nodePositions.get(match.loserCanonicalId) ?? {
        x: 0,
        y: 0,
      };
      const rivalryId = [match.winnerCanonicalId, match.loserCanonicalId]
        .sort()
        .join('__');
      const deltaX = targetPosition.x - sourcePosition.x;
      const deltaY = targetPosition.y - sourcePosition.y;

      return {
        id: `edge_${index + 1}`,
        source: match.winnerCanonicalId,
        target: match.loserCanonicalId,
        weight: 1,
        eventId: match.eventId,
        eventName: match.eventName,
        year: match.year,
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

function buildAthleteMetadataIndex(adccAthletes: AdccAthlete[]) {
  return new Map(
    adccAthletes.map(
      (athlete) => [toAthleteLookupKey(athlete.name, athlete.sex), athlete] as const,
    ),
  );
}

function resolveAthleteMetadata(
  athlete: AdccAthlete,
  athleteMetadata: Map<string, AdccAthlete>,
) {
  const canonicalAthlete = athleteMetadata.get(
    toAthleteLookupKey(athlete.name, athlete.sex),
  );

  return {
    name: canonicalAthlete?.name ?? athlete.name,
    sex: canonicalAthlete?.sex ?? athlete.sex,
    primaryWeightClass:
      canonicalAthlete?.primaryWeightClass ?? athlete.primaryWeightClass,
    activeYearFirst:
      canonicalAthlete?.activeYearFirst ?? athlete.activeYearFirst,
    activeYearLast: canonicalAthlete?.activeYearLast ?? athlete.activeYearLast,
    totalMatches: canonicalAthlete?.totalMatches ?? athlete.totalMatches,
    nationality: canonicalAthlete?.nationality ?? athlete.nationality,
    team: canonicalAthlete?.team ?? athlete.team,
  };
}

function toAthleteLookupKey(name: string, sex: string) {
  return `${name.trim().toLowerCase()}::${sex.trim().toUpperCase()}`;
}

function createStableNodePositions(
  athletes: AdccAthlete[],
  metrics: CanonicalAthleteMetricsSnapshot,
): Map<string, { x: number; y: number }> {
  const sortedAthletes = [...athletes].sort((left, right) => {
    const leftMetric = metrics.athletes.get(left.canonicalAthleteId);
    const rightMetric = metrics.athletes.get(right.canonicalAthleteId);
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
    return new Map([
      [sortedAthletes[0].canonicalAthleteId, { x: 50, y: 50 }],
    ]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radiusLimit = 42;

  sortedAthletes.forEach((athlete, index) => {
    const radius = Math.sqrt(index / (sortedAthletes.length - 1)) * radiusLimit;
    const angle = index * goldenAngle;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.82;

    positions.set(athlete.canonicalAthleteId, {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    });
  });

  return positions;
}
