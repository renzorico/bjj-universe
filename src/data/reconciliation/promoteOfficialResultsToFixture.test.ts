import { promoteOfficialResultsToFixture } from '@/data/reconciliation/promoteOfficialResultsToFixture';
import { AdccEventReconciliationArtifact } from '@/data/reconciliation/buildAdccEventReconciliation';
import { RawAdccFixture } from '@/domain/types';

describe('promoteOfficialResultsToFixture', () => {
  it('promotes official-only event rows into auditable official-result relations when Kaggle has no event rows', () => {
    const baseFixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'base',
      notes: 'base',
      matches: [],
    };
    const artifact: AdccEventReconciliationArtifact = {
      generatedAt: new Date().toISOString(),
      event: {
        slug: 'adcc-worlds-2024',
        year: 2024,
        eventType: 'worlds',
        title: 'ADCC Submission Fighting World Championship 2024',
        sourceUrl: 'https://example.com',
      },
      sourcePrecedence: [],
      summary: {
        officialRows: 3,
        kaggleRows: 0,
        exactMatches: 0,
        likelyMatches: 0,
        mismatches: 0,
        officialOnly: 3,
        kaggleOnly: 0,
        manualReviewCount: 3,
        kaggleEventRowsInYear: 0,
      },
      exactMatches: [],
      likelyMatches: [],
      mismatches: [],
      officialOnlyRows: [
        {
          rowId: '1',
          eventYear: 2024,
          sex: 'M',
          weightClass: '66KG',
          athleteName: 'Diogo Reis',
          athleteKey: 'diogo-reis',
          rank: 1,
          source: 'official',
          divisionLabel: 'M:66KG',
          notes: [],
        },
        {
          rowId: '2',
          eventYear: 2024,
          sex: 'M',
          weightClass: '66KG',
          athleteName: 'Diego Pato',
          athleteKey: 'diego-pato',
          rank: 2,
          source: 'official',
          divisionLabel: 'M:66KG',
          notes: [],
        },
        {
          rowId: '3',
          eventYear: 2024,
          sex: 'M',
          weightClass: '66KG',
          athleteName: 'Josh Cisneros',
          athleteKey: 'josh-cisneros',
          rank: 3,
          source: 'official',
          divisionLabel: 'M:66KG',
          notes: [],
        },
      ],
      kaggleOnlyRows: [],
      manualReview: [],
    };

    const promoted = promoteOfficialResultsToFixture(baseFixture, [artifact]);

    expect(promoted.matches).toHaveLength(3);
    expect(promoted.matches.every((match) => match.recordType === 'official_result_relation')).toBe(true);
    expect(promoted.matches.map((match) => match.round)).toEqual([
      'PLACE_1_OVER_2',
      'PLACE_1_OVER_3',
      'PLACE_2_OVER_3',
    ]);
  });

  it('does not promote an event when Kaggle already has event rows', () => {
    const baseFixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'base',
      notes: 'base',
      matches: [],
    };
    const artifact = {
      generatedAt: new Date().toISOString(),
      event: {
        slug: 'adcc-worlds-2019',
        year: 2019,
        eventType: 'worlds',
        title: 'ADCC 2019',
        sourceUrl: 'https://example.com',
      },
      sourcePrecedence: [],
      summary: {
        officialRows: 30,
        kaggleRows: 22,
        exactMatches: 10,
        likelyMatches: 2,
        mismatches: 1,
        officialOnly: 17,
        kaggleOnly: 8,
        manualReviewCount: 28,
        kaggleEventRowsInYear: 92,
      },
      exactMatches: [],
      likelyMatches: [],
      mismatches: [],
      officialOnlyRows: [],
      kaggleOnlyRows: [],
      manualReview: [],
    } as AdccEventReconciliationArtifact;

    const promoted = promoteOfficialResultsToFixture(baseFixture, [artifact]);

    expect(promoted.matches).toHaveLength(0);
  });
});
