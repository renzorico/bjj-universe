import matchMapping from '../processed/adcc-match-mapping.json';
import { CanonicalAdccMatch } from '@/domain/types';

interface MatchMappingEntry {
  matchId: string;
  winnerCanonicalId: string;
  loserCanonicalId: string;
  sex: string;
  weightClass: string;
  year: number;
  method?: string;
  roundLabel?: string;
}

let cachedMatches: CanonicalAdccMatch[] | null = null;

export function getAllCanonicalMatches(): CanonicalAdccMatch[] {
  if (cachedMatches) {
    return cachedMatches;
  }

  // Already sorted by year then matchId in the JSON
  cachedMatches = (matchMapping as MatchMappingEntry[]).map((m) => ({
    id: `match_${m.matchId}`,
    sourceMatchId: m.matchId,
    eventId: `event_adcc-world-championship-${m.year}`,
    eventName: 'ADCC World Championship',
    year: m.year,
    winnerCanonicalId: m.winnerCanonicalId,
    loserCanonicalId: m.loserCanonicalId,
    sex: m.sex,
    weightClass: m.weightClass,
    method: m.method,
    roundLabel: m.roundLabel,
  }));

  return cachedMatches;
}
