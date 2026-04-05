import {
  buildAdccEventReconciliation,
  ReconciliationManifestEntry,
} from '@/data/reconciliation/buildAdccEventReconciliation';
import { RawAdccFixture } from '@/domain/types';
import { ScrapedAdccOfficialResultsPage } from '@/data/scraping/parseAdccOfficialResultsPage';

describe('buildAdccEventReconciliation', () => {
  it('buckets exact, likely, mismatch, official-only, and kaggle-only rows', () => {
    const manifest: ReconciliationManifestEntry = {
      slug: 'test-2022',
      eventYear: 2022,
      eventType: 'worlds',
      officialParsedPath: 'ignored.json',
    };

    const official: ScrapedAdccOfficialResultsPage = {
      sourceUrl: 'https://example.com',
      scrapedAt: new Date().toISOString(),
      eventTitle: 'ADCC 2022',
      organizer: 'ADCC',
      location: 'Las Vegas',
      eventDate: 'Sep 18, 2022',
      divisions: [
        {
          divisionLabel: 'MALE -77KG',
          sex: 'M',
          weightClass: '-77KG',
          placements: [
            { rank: 1, athleteName: 'Champion Exact' },
            { rank: 3, athleteName: 'Mismatch Athlete' },
            { rank: 3, athleteName: 'Chris Jones' },
            { rank: 3, athleteName: 'Only Official' },
          ],
        },
      ],
    };

    const fixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'fixture',
      notes: 'fixture',
      matches: [
        {
          sourceMatchId: '1',
          event: { name: 'ADCC', year: 2022 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'Champion Exact' },
          loser: { name: 'Mismatch Athlete' },
          round: 'F',
        },
        {
          sourceMatchId: '2',
          event: { name: 'ADCC', year: 2022 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'C. Jones' },
          loser: { name: 'Semifinalist' },
          round: 'R1',
        },
        {
          sourceMatchId: '3',
          event: { name: 'ADCC', year: 2022 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'Spare Athlete' },
          loser: { name: 'Other Athlete' },
          round: '3RD',
        },
        {
          sourceMatchId: '4',
          event: { name: 'ADCC', year: 2022 },
          sex: 'M',
          weightClass: '77KG',
          winner: { name: 'Mismatch Athlete' },
          loser: { name: 'Other Loser' },
          round: 'R2',
        },
      ],
    };

    const artifact = buildAdccEventReconciliation(manifest, official, fixture);

    expect(artifact.summary.exactMatches).toBe(1);
    expect(artifact.summary.mismatches).toBe(1);
    expect(artifact.summary.likelyMatches).toBe(1);
    expect(artifact.summary.officialOnly).toBe(1);
    expect(artifact.summary.kaggleOnly).toBe(1);
  });

  it('marks all official rows as official-only when the Kaggle event year is absent', () => {
    const manifest: ReconciliationManifestEntry = {
      slug: 'adcc-worlds-2024',
      eventYear: 2024,
      eventType: 'worlds',
      officialParsedPath: 'ignored.json',
    };

    const official: ScrapedAdccOfficialResultsPage = {
      sourceUrl: 'https://example.com/2024',
      scrapedAt: new Date().toISOString(),
      eventTitle: 'ADCC 2024',
      organizer: 'ADCC',
      location: 'Las Vegas',
      eventDate: 'Aug 17, 2024',
      divisions: [
        {
          divisionLabel: 'MALE -66KG',
          sex: 'M',
          weightClass: '-66KG',
          placements: [{ rank: 1, athleteName: 'Diogo Reis' }],
        },
      ],
    };

    const fixture: RawAdccFixture = {
      source: 'adcc-historical-kaggle',
      label: 'fixture',
      notes: 'fixture',
      matches: [
        {
          sourceMatchId: '1',
          event: { name: 'ADCC', year: 2022 },
          sex: 'M',
          weightClass: '66KG',
          winner: { name: 'Someone Else' },
          loser: { name: 'Other Person' },
        },
      ],
    };

    const artifact = buildAdccEventReconciliation(manifest, official, fixture);

    expect(artifact.summary.kaggleRows).toBe(0);
    expect(artifact.summary.officialOnly).toBe(1);
    expect(artifact.summary.exactMatches).toBe(0);
  });
});
