import { NormalizedCompetitionData } from '@/domain/types';
import { AthleteEnrichmentTarget } from '@/data/enrichment/types';

export function buildAthleteEnrichmentTargets(
  normalized: NormalizedCompetitionData,
  minimumFightCount = 10,
): AthleteEnrichmentTarget[] {
  return normalized.athletes
    .map((athlete) => ({
      athleteId: athlete.id,
      athleteName: athlete.name,
      matchCount: normalized.matches.filter(
        (match) =>
          match.winnerId === athlete.id || match.loserId === athlete.id,
      ).length,
    }))
    .filter((athlete) => athlete.matchCount > minimumFightCount)
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return left.athleteName.localeCompare(right.athleteName);
    });
}
