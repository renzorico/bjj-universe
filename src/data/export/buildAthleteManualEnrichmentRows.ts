import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
import { NormalizedCompetitionData } from '@/domain/types';

export interface AthleteManualEnrichmentRow {
  canonicalAthleteId: string;
  name: string;
  sex: string;
  primaryWeightClass: string;
  activeYearFirst: number | null;
  activeYearLast: number | null;
  totalMatches: number;
}

function selectPrimaryWeightClass(
  athleteId: string,
  normalized: NormalizedCompetitionData,
): string {
  const counts = new Map<string, number>();

  for (const match of normalized.matches) {
    if (match.winnerId !== athleteId && match.loserId !== athleteId) {
      continue;
    }

    if (!match.weightClass) {
      continue;
    }

    counts.set(match.weightClass, (counts.get(match.weightClass) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .at(0)?.[0] ?? '';
}

export function buildAthleteManualEnrichmentRows(
  normalized: NormalizedCompetitionData,
): AthleteManualEnrichmentRow[] {
  const metrics = buildAthleteMetrics(normalized);

  return normalized.athletes
    .map((athlete) => {
      const metric = metrics.athletes.get(athlete.id);
      const yearsActive = metric?.yearsActive ?? [];
      const totalMatches = (metric?.wins ?? 0) + (metric?.losses ?? 0);

      return {
        canonicalAthleteId: athlete.id,
        name: athlete.name,
        sex: athlete.sexes.join('|'),
        primaryWeightClass: selectPrimaryWeightClass(athlete.id, normalized),
        activeYearFirst: yearsActive.at(0) ?? null,
        activeYearLast: yearsActive.at(-1) ?? null,
        totalMatches,
      };
    })
    .sort((left, right) => {
      if (right.totalMatches !== left.totalMatches) {
        return right.totalMatches - left.totalMatches;
      }

      return left.name.localeCompare(right.name);
    });
}

