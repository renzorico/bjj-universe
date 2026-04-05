import { buildAthleteEnrichmentTargets } from '@/data/enrichment/buildAthleteEnrichmentTargets';
import { NormalizedCompetitionData } from '@/domain/types';

describe('buildAthleteEnrichmentTargets', () => {
  it('returns only athletes over the minimum fight threshold', () => {
    const normalized: NormalizedCompetitionData = {
      athletes: [
        { id: 'a1', name: 'High Volume', sexes: ['M'], weightClasses: ['77KG'] },
        { id: 'a2', name: 'Low Volume', sexes: ['F'], weightClasses: ['60KG'] },
      ],
      events: [{ id: 'event_1', name: 'ADCC', year: 2022 }],
      matches: [
        ...Array.from({ length: 11 }, (_, index) => ({
          id: `match_${index}`,
          eventId: 'event_1',
          winnerId: 'a1',
          loserId: 'a2',
          sex: 'M',
          weightClass: '77KG',
        })),
      ],
    };

    expect(buildAthleteEnrichmentTargets(normalized, 10)).toEqual([
      {
        athleteId: 'a1',
        athleteName: 'High Volume',
        matchCount: 11,
      },
      {
        athleteId: 'a2',
        athleteName: 'Low Volume',
        matchCount: 11,
      },
    ]);
  });
});
