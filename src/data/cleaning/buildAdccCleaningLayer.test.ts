import { buildAdccCleaningLayer } from '@/data/cleaning/buildAdccCleaningLayer';
import { RawAdccFixture } from '@/domain/types';

describe('buildAdccCleaningLayer', () => {
  it('creates canonical records with provenance and quarantine flags instead of silent merges', () => {
    const fixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'fixture',
      notes: 'fixture',
      matches: [
        {
          sourceMatchId: '1',
          event: { name: 'ADCC', year: 2019 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'Tomas Szczerek' },
          loser: { name: 'Opponent A' },
          winnerSourceId: '500',
          loserSourceId: '-1',
        },
        {
          sourceMatchId: '2',
          event: { name: 'ADCC', year: 2022 },
          sex: 'F',
          weightClass: '+60KG',
          winner: { name: 'Tomas Szczerek' },
          loser: { name: 'Opponent B' },
          winnerSourceId: '500',
          loserSourceId: '-1',
        },
      ],
    };

    const cleaned = buildAdccCleaningLayer(fixture);
    const tomas = cleaned.athletes.find(
      (athlete) => athlete.canonicalAthleteId === 'athlete_500',
    );

    expect(tomas).toMatchObject({
      displayName: 'Tomas Szczerek',
      sexes: ['M', 'F'],
      sourceAthleteIds: ['500'],
    });
    expect(
      tomas?.flags.some((flag) => flag.code === 'source_id_cross_sex'),
    ).toBe(true);
    expect(
      cleaned.quarantine.some((flag) => flag.code === 'source_id_cross_sex'),
    ).toBe(true);
    expect(
      cleaned.athletes.some((athlete) =>
        athlete.flags.some((flag) => flag.code === 'missing_source_athlete_id'),
      ),
    ).toBe(true);
  });
});
