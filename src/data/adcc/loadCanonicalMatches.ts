import { loadProcessedCompetitionDataset } from '@/data/validation/loadProcessedCompetitionDataset';
import { CanonicalAdccMatch } from '@/domain/types';

const processedDataset = loadProcessedCompetitionDataset();

let cachedMatches: CanonicalAdccMatch[] | null = null;

export function getAllCanonicalMatches(): CanonicalAdccMatch[] {
  if (cachedMatches) {
    return cachedMatches;
  }

  const eventById = new Map(
    processedDataset.normalized.events.map((event) => [event.id, event]),
  );
  cachedMatches = processedDataset.normalized.matches
    .map((match) => {
      const sourceMatchId = match.sourceMatchId ?? match.id;
      const event = eventById.get(match.eventId);

      return {
        id: match.id,
        sourceMatchId,
        eventId: match.eventId,
        eventName: event?.name ?? 'ADCC World Championship',
        year: event?.year ?? 0,
        winnerCanonicalId: match.winnerId,
        loserCanonicalId: match.loserId,
        sex: match.sex,
        weightClass: match.weightClass,
        method: match.method,
        roundLabel: match.roundLabel,
      };
    })
    .sort((left, right) => {
      if (left.year !== right.year) {
        return left.year - right.year;
      }

      return left.sourceMatchId.localeCompare(right.sourceMatchId);
    });

  return cachedMatches;
}
