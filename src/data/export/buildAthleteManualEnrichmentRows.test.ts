import fixture from '@/data/fixtures/adcc-sample.fixture.json';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import { buildAthleteManualEnrichmentRows } from '@/data/export/buildAthleteManualEnrichmentRows';
import { RawAdccFixture } from '@/domain/types';

describe('buildAthleteManualEnrichmentRows', () => {
  it('builds sorted manual-enrichment rows from canonical athletes', () => {
    const normalized = normalizeAdccFixture(fixture as RawAdccFixture);
    const rows = buildAthleteManualEnrichmentRows(normalized);

    expect(rows[0]).toEqual({
      canonicalAthleteId: 'athlete_craig-jones-m',
      name: 'Craig Jones',
      sex: 'M',
      primaryWeightClass: '-99kg',
      activeYearFirst: 2022,
      activeYearLast: 2024,
      totalMatches: 2,
    });

    expect(rows).toHaveLength(7);
    expect(rows.map((row) => row.totalMatches)).toEqual([2, 2, 2, 2, 2, 1, 1]);

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];

      if (!previous || !current) {
        continue;
      }

      expect(previous.totalMatches).toBeGreaterThanOrEqual(current.totalMatches);

      if (previous.totalMatches === current.totalMatches) {
        expect(previous.name.localeCompare(current.name)).toBeLessThanOrEqual(0);
      }
    }
  });
});
