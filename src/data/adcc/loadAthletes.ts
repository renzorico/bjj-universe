import { loadProcessedCompetitionDataset } from '@/data/validation/loadProcessedCompetitionDataset';
import { AdccAthlete } from '@/domain/types';

export const ADCC_ATHLETE_EXPECTED_COLUMNS = [
  'canonical_athlete_id',
  'name',
  'sex',
  'primary_weight_class',
  'active_year_first',
  'active_year_last',
  'total_matches',
  'nationality',
  'team',
] as const;

const processedDataset = loadProcessedCompetitionDataset();

let cachedAthletes: AdccAthlete[] | null = null;

export function getAllAthletes(): AdccAthlete[] {
  if (cachedAthletes) {
    return cachedAthletes;
  }

  const eventYearById = new Map(
    processedDataset.normalized.events.map((event) => [event.id, event.year]),
  );
  const statsByAthleteId = buildAthleteStats(
    processedDataset.normalized.matches,
    eventYearById,
  );

  cachedAthletes = processedDataset.normalized.athletes
    .map((athlete) => {
      const stats = statsByAthleteId.get(athlete.id);

      return {
        canonicalAthleteId: athlete.id,
        name: athlete.name,
        sex: athlete.sexes[0] ?? 'M',
        primaryWeightClass: stats?.primaryWeightClass ?? athlete.weightClasses[0] ?? 'ABS',
        activeYearFirst: stats?.activeYearFirst ?? 0,
        activeYearLast: stats?.activeYearLast ?? 0,
        totalMatches: stats?.totalMatches ?? 0,
        nationality: athlete.nationality ?? null,
        team: athlete.team ?? null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return cachedAthletes;
}

function buildAthleteStats(
  matches: ReturnType<typeof loadProcessedCompetitionDataset>['normalized']['matches'],
  eventYearById: Map<string, number>,
) {
  const registry = new Map<
    string,
    {
      totalMatches: number;
      activeYearFirst: number;
      activeYearLast: number;
      weightClassCounts: Map<string, number>;
    }
  >();

  for (const match of matches) {
    const year = eventYearById.get(match.eventId) ?? 0;
    updateAthleteStats(registry, match.winnerId, year, match.weightClass);
    updateAthleteStats(registry, match.loserId, year, match.weightClass);
  }

  const resolved = new Map<
    string,
    {
      totalMatches: number;
      activeYearFirst: number;
      activeYearLast: number;
      primaryWeightClass: string;
    }
  >();

  for (const [athleteId, stats] of registry.entries()) {
    const primaryWeightClass =
      [...stats.weightClassCounts.entries()].sort(
        ([leftWeightClass, leftCount], [rightWeightClass, rightCount]) =>
          rightCount - leftCount || leftWeightClass.localeCompare(rightWeightClass),
      )[0]?.[0] ?? 'ABS';

    resolved.set(athleteId, {
      totalMatches: stats.totalMatches,
      activeYearFirst: stats.activeYearFirst,
      activeYearLast: stats.activeYearLast,
      primaryWeightClass,
    });
  }

  return resolved;
}

function updateAthleteStats(
  registry: Map<
    string,
    {
      totalMatches: number;
      activeYearFirst: number;
      activeYearLast: number;
      weightClassCounts: Map<string, number>;
    }
  >,
  athleteId: string,
  year: number,
  weightClass?: string,
) {
  const current =
    registry.get(athleteId) ?? {
      totalMatches: 0,
      activeYearFirst: year,
      activeYearLast: year,
      weightClassCounts: new Map<string, number>(),
    };

  current.totalMatches += 1;
  current.activeYearFirst = Math.min(current.activeYearFirst, year);
  current.activeYearLast = Math.max(current.activeYearLast, year);

  if (weightClass) {
    current.weightClassCounts.set(
      weightClass,
      (current.weightClassCounts.get(weightClass) ?? 0) + 1,
    );
  }

  registry.set(athleteId, current);
}
