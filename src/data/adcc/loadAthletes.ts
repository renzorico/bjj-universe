import enrichedAthletes from '../processed/adcc-athletes-enriched.json';
import { AdccAthlete } from '@/domain/types';

// Column names preserved for test compatibility
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

let cachedAthletes: AdccAthlete[] | null = null;

export function getAllAthletes(): AdccAthlete[] {
  if (cachedAthletes) {
    return cachedAthletes;
  }

  cachedAthletes = (enrichedAthletes as AdccAthlete[]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return cachedAthletes;
}
