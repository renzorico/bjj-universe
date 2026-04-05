import {
  ADCC_ATHLETE_EXPECTED_COLUMNS,
  getAllAthletes,
} from '@/data/adcc/loadAthletes';

describe('getAllAthletes', () => {
  it('loads typed canonical ADCC athlete rows with the expected schema', () => {
    const athletes = getAllAthletes();
    const athlete = athletes.find(
      (entry) => entry.canonicalAthleteId === 'athlete_nicholas-meregali-m',
    );

    expect(ADCC_ATHLETE_EXPECTED_COLUMNS).toEqual([
      'canonical_athlete_id',
      'name',
      'sex',
      'primary_weight_class',
      'active_year_first',
      'active_year_last',
      'total_matches',
      'nationality',
      'team',
    ]);
    expect(athletes).toHaveLength(334);
    expect(athlete).toEqual({
      canonicalAthleteId: 'athlete_nicholas-meregali-m',
      name: 'Nicholas Meregali',
      sex: 'M',
      primaryWeightClass: '99KG',
      activeYearFirst: 2022,
      activeYearLast: 2022,
      totalMatches: 8,
      nationality: 'Brazil',
      team: 'New Wave Jiu Jitsu',
    });
    expect(
      athletes.some(
        (entry) => entry.canonicalAthleteId === 'athlete_yuji-arai-m',
      ),
    ).toBe(false);
  });
});
