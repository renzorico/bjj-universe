import { buildAdccIntegrityReport } from '@/data/validation/buildAdccIntegrityReport';
import {
  NormalizedCompetitionData,
  RawAdccFixture,
} from '@/domain/types';

describe('buildAdccIntegrityReport', () => {
  it('surfaces cross-sex athletes, initials collisions, source id conflicts, and missing 2024 worlds', () => {
    const fixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'fixture',
      notes: 'fixture',
      matches: [
        {
          sourceMatchId: '1',
          event: { name: 'ADCC', year: 2017 },
          sex: 'F',
          weightClass: '60KG',
          winner: { name: 'Bianca Basilio' },
          loser: { name: 'E. Karppinen' },
          winnerSourceId: '10',
          loserSourceId: '-1',
        },
        {
          sourceMatchId: '2',
          event: { name: 'ADCC', year: 2022 },
          sex: 'F',
          weightClass: '60KG',
          winner: { name: 'Brianna Ste-Marie' },
          loser: { name: 'Elvira Karppinen' },
          winnerSourceId: '11',
          loserSourceId: '-1',
        },
        {
          sourceMatchId: '3',
          event: { name: 'ADCC', year: 2019 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'Tomas Szczerek' },
          loser: { name: 'Opponent A' },
          winnerSourceId: '500',
          loserSourceId: '600',
        },
        {
          sourceMatchId: '4',
          event: { name: 'ADCC', year: 2022 },
          sex: 'F',
          weightClass: '+60KG',
          winner: { name: 'Tomas Szczerek' },
          loser: { name: 'Opponent B' },
          winnerSourceId: '500',
          loserSourceId: '601',
        },
      ],
    };

    const normalized: NormalizedCompetitionData = {
      athletes: [
        {
          id: 'athlete_500',
          name: 'Tomas Szczerek',
          sexes: ['M', 'F'],
          weightClasses: ['77KG', '+60KG'],
        },
        {
          id: 'athlete_elvira-karppinen-f',
          name: 'Elvira Karppinen',
          sexes: ['F'],
          weightClasses: ['60KG'],
        },
      ],
      events: [
        { id: 'event_2017', name: 'ADCC', year: 2017 },
        { id: 'event_2019', name: 'ADCC', year: 2019 },
        { id: 'event_2022', name: 'ADCC', year: 2022 },
      ],
      matches: [
        {
          id: 'match_1',
          eventId: 'event_2017',
          winnerId: 'athlete_bianca',
          loserId: 'athlete_elvira-karppinen-f',
          sex: 'F',
          weightClass: '60KG',
        },
        {
          id: 'match_2',
          eventId: 'event_2022',
          winnerId: 'athlete_brianna',
          loserId: 'athlete_elvira-karppinen-f',
          sex: 'F',
          weightClass: '60KG',
        },
        {
          id: 'match_3',
          eventId: 'event_2019',
          winnerId: 'athlete_500',
          loserId: 'athlete_opponent-a',
          sex: 'M',
          weightClass: '77KG',
        },
        {
          id: 'match_4',
          eventId: 'event_2022',
          winnerId: 'athlete_500',
          loserId: 'athlete_opponent-b',
          sex: 'F',
          weightClass: '+60KG',
        },
      ],
    };

    const report = buildAdccIntegrityReport(fixture, normalized, {
      highMatchCountThreshold: 1,
      longEditionSpanThreshold: 1,
    });

    expect(report.anomalies.crossSexAthletes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          athleteId: 'athlete_500',
          athleteName: 'Tomas Szczerek',
        }),
      ]),
    );
    expect(report.anomalies.initialsCollisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          names: ['E. Karppinen', 'Elvira Karppinen'],
        }),
      ]),
    );
    expect(report.anomalies.sourceIdentityConflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceAthleteId: '500',
          sexes: ['F', 'M'],
        }),
      ]),
    );
    expect(report.anomalies.missingWorldEvents.some((event) => event.year === 2024)).toBe(
      true,
    );
  });
});
