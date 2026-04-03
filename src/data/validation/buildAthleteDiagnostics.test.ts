import { buildAthleteDiagnostics } from '@/data/validation/buildAthleteDiagnostics';
import { NormalizedCompetitionData } from '@/domain/types';

describe('buildAthleteDiagnostics', () => {
  it('reports top athletes by match count and flags suspicious active spans', () => {
    const normalized: NormalizedCompetitionData = {
      athletes: [
        {
          id: 'athlete_1',
          name: 'Elvira Karppinen',
          sexes: ['F'],
          weightClasses: ['60KG'],
        },
        {
          id: 'athlete_2',
          name: 'Impossible Span',
          sexes: ['M'],
          weightClasses: ['77KG'],
        },
      ],
      events: [
        { id: 'event_1', name: 'ADCC', year: 2017 },
        { id: 'event_2', name: 'ADCC', year: 2022 },
        { id: 'event_3', name: 'ADCC', year: 1996 },
        { id: 'event_4', name: 'ADCC', year: 2024 },
      ],
      matches: [
        {
          id: 'match_1',
          eventId: 'event_1',
          winnerId: 'athlete_1',
          loserId: 'athlete_2',
          sex: 'F',
          weightClass: '60KG',
        },
        {
          id: 'match_2',
          eventId: 'event_2',
          winnerId: 'athlete_1',
          loserId: 'athlete_2',
          sex: 'F',
          weightClass: '60KG',
        },
        {
          id: 'match_3',
          eventId: 'event_3',
          winnerId: 'athlete_2',
          loserId: 'athlete_1',
          sex: 'M',
          weightClass: '77KG',
        },
        {
          id: 'match_4',
          eventId: 'event_4',
          winnerId: 'athlete_2',
          loserId: 'athlete_1',
          sex: 'M',
          weightClass: '77KG',
        },
      ],
    };

    const diagnostics = buildAthleteDiagnostics(normalized, 1);

    expect(diagnostics.topAthletesByMatchCount).toHaveLength(1);
    expect(diagnostics.topAthletesByMatchCount[0]).toMatchObject({
      athleteName: 'Elvira Karppinen',
      matchCount: 4,
      firstMatchYear: 1996,
      lastMatchYear: 2024,
    });
    expect(diagnostics.outOfBoundsCount).toBeGreaterThan(0);
    expect(diagnostics.overlongSpanCount).toBeGreaterThan(0);
    expect(
      diagnostics.suspiciousAthletes.some((athlete) =>
        athlete.reasons.includes('out_of_bounds_year'),
      ),
    ).toBe(true);
  });
});
