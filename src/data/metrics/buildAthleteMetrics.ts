import { Athlete, NormalizedCompetitionData } from '@/domain/types';

export interface AthleteMetric {
  athlete: Athlete;
  wins: number;
  losses: number;
  yearsActive: number[];
  rivalryCount: number;
  bridgeScore: number;
}

export interface AthleteMetricsSnapshot {
  athletes: Map<string, AthleteMetric>;
  topRivalries: {
    id: string;
    label: string;
    matches: number;
  }[];
}

export function buildAthleteMetrics(
  normalized: NormalizedCompetitionData,
): AthleteMetricsSnapshot {
  const athleteMetrics = new Map(
    normalized.athletes.map((athlete) => [
      athlete.id,
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

  const eventYears = new Map(
    normalized.events.map((event) => [event.id, event.year]),
  );
  const rivalries = new Map<string, number>();

  for (const match of normalized.matches) {
    const winnerMetric = athleteMetrics.get(match.winnerId);
    const loserMetric = athleteMetrics.get(match.loserId);
    const year = eventYears.get(match.eventId);

    if (!winnerMetric || !loserMetric || year === undefined) {
      continue;
    }

    winnerMetric.wins += 1;
    loserMetric.losses += 1;
    winnerMetric.yearsActive.add(year);
    loserMetric.yearsActive.add(year);
    winnerMetric.opponents.add(match.loserId);
    loserMetric.opponents.add(match.winnerId);

    const rivalryId = [match.winnerId, match.loserId].sort().join('__');
    rivalries.set(rivalryId, (rivalries.get(rivalryId) ?? 0) + 1);
    winnerMetric.rivalryIds.add(rivalryId);
    loserMetric.rivalryIds.add(rivalryId);
  }

  const athletes = new Map<string, AthleteMetric>();

  for (const [id, metric] of athleteMetrics.entries()) {
    athletes.set(id, {
      athlete: metric.athlete,
      wins: metric.wins,
      losses: metric.losses,
      yearsActive: [...metric.yearsActive].sort((left, right) => left - right),
      rivalryCount: metric.rivalryIds.size,
      bridgeScore: metric.opponents.size * 10 + metric.rivalryIds.size,
    });
  }

  const topRivalries = [...rivalries.entries()]
    .map(([id, matches]) => {
      const [leftId, rightId] = id.split('__');
      const leftName = athletes.get(leftId)?.athlete.name ?? leftId;
      const rightName = athletes.get(rightId)?.athlete.name ?? rightId;

      return {
        id,
        label: `${leftName} vs ${rightName}`,
        matches,
      };
    })
    .sort((left, right) => right.matches - left.matches)
    .slice(0, 3);

  return {
    athletes,
    topRivalries,
  };
}
