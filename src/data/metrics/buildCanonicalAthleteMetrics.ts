import { AdccAthlete, CanonicalAdccMatch } from '@/domain/types';

export interface CanonicalAthleteMetric {
  athlete: AdccAthlete;
  wins: number;
  losses: number;
  yearsActive: number[];
  rivalryCount: number;
  bridgeScore: number;
}

export interface CanonicalAthleteMetricsSnapshot {
  athletes: Map<string, CanonicalAthleteMetric>;
  topRivalries: {
    id: string;
    label: string;
    matches: number;
  }[];
}

export function buildCanonicalAthleteMetrics(
  athletes: AdccAthlete[],
  matches: CanonicalAdccMatch[],
): CanonicalAthleteMetricsSnapshot {
  const athleteMetrics = new Map(
    athletes.map((athlete) => [
      athlete.canonicalAthleteId,
      {
        athlete,
        wins: 0,
        losses: 0,
        yearsActive: new Set<number>(),
        rivalryIds: new Set<string>(),
        opponents: new Set<string>(),
      },
    ]),
  );
  const rivalries = new Map<string, number>();

  for (const match of matches) {
    const winnerMetric = athleteMetrics.get(match.winnerCanonicalId);
    const loserMetric = athleteMetrics.get(match.loserCanonicalId);

    if (!winnerMetric || !loserMetric) {
      continue;
    }

    winnerMetric.wins += 1;
    loserMetric.losses += 1;
    winnerMetric.yearsActive.add(match.year);
    loserMetric.yearsActive.add(match.year);
    winnerMetric.opponents.add(match.loserCanonicalId);
    loserMetric.opponents.add(match.winnerCanonicalId);

    const rivalryId = [match.winnerCanonicalId, match.loserCanonicalId]
      .sort()
      .join('__');
    rivalries.set(rivalryId, (rivalries.get(rivalryId) ?? 0) + 1);
    winnerMetric.rivalryIds.add(rivalryId);
    loserMetric.rivalryIds.add(rivalryId);
  }

  const metrics = new Map<string, CanonicalAthleteMetric>();

  for (const [athleteId, metric] of athleteMetrics.entries()) {
    metrics.set(athleteId, {
      athlete: metric.athlete,
      wins: metric.wins,
      losses: metric.losses,
      yearsActive: [...metric.yearsActive].sort((left, right) => left - right),
      rivalryCount: metric.rivalryIds.size,
      bridgeScore: metric.opponents.size * 10 + metric.rivalryIds.size,
    });
  }

  const topRivalries = [...rivalries.entries()]
    .map(([id, count]) => {
      const [leftId, rightId] = id.split('__');
      const leftName = metrics.get(leftId)?.athlete.name ?? leftId;
      const rightName = metrics.get(rightId)?.athlete.name ?? rightId;

      return {
        id,
        label: `${leftName} vs ${rightName}`,
        matches: count,
      };
    })
    .sort((left, right) => right.matches - left.matches)
    .slice(0, 3);

  return {
    athletes: metrics,
    topRivalries,
  };
}
