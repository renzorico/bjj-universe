import { getAllAthletes } from '@/data/adcc/loadAthletes';
import {
  buildAdccHistoricalSourceDataset,
  findAthleteRowsByName,
  parseAdccHistoricalCsv,
  validateAdccHistoricalSchema,
} from '@/data/ingestion/adccHistoricalDataset';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import processedDataset from '@/data/processed/adcc-historical.processed.json';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
import { buildAthleteDiagnostics } from '@/data/validation/buildAthleteDiagnostics';
import { ProcessedCompetitionDataset } from '@/domain/types';

describe('adccHistoricalDataset ingestion', () => {
  it('parses the real schema and maps accepted rows into canonical source matches', () => {
    const csv = [
      'match_id;winner_id;winner_name;loser_id;loser_name;win_type;submission;winner_points;loser_points;adv_pen;weight_class;sex;stage;year',
      '35049;7507;Nicholas Meregali;9554;Henrique Cardoso;SUBMISSION;Kimura;-1;-1;;99KG;M;R1;2022',
    ].join('\n');

    const rows = parseAdccHistoricalCsv(csv);
    const schema = validateAdccHistoricalSchema(Object.keys(rows[0]));
    const buildResult = buildAdccHistoricalSourceDataset(
      rows,
      Object.keys(rows[0]),
    );

    expect(schema.missingRequiredColumns).toEqual([]);
    expect(buildResult.validation.acceptedRows).toBe(1);
    expect(buildResult.validation.quarantinedRows).toBe(0);
    expect(buildResult.sourceDataset.matches[0]).toMatchObject({
      sourceMatchId: '35049',
      sex: 'M',
      weightClass: '99KG',
      method: 'SUBMISSION',
      submission: 'Kimura',
      event: {
        name: 'ADCC World Championship',
        year: 2022,
        inferredName: true,
      },
    });
  });

  it('quarantines rows with invalid year or missing critical fields', () => {
    const rows = [
      {
        match_id: '1',
        winner_id: '11',
        winner_name: 'Winner',
        loser_id: '22',
        loser_name: '',
        win_type: 'POINTS',
        submission: '',
        winner_points: '2',
        loser_points: '0',
        adv_pen: '',
        weight_class: '77KG',
        sex: 'M',
        stage: 'F',
        year: 'nineteen',
      },
    ];

    const buildResult = buildAdccHistoricalSourceDataset(
      rows,
      Object.keys(rows[0]),
    );

    expect(buildResult.validation.acceptedRows).toBe(0);
    expect(buildResult.validation.quarantinedRows).toBe(1);
    expect(buildResult.quarantine[0].reasons).toEqual(
      expect.arrayContaining(['missing_loser_name', 'invalid_year']),
    );
  });

  it('exports graph-ready data from the real processed dataset', () => {
    const processed = processedDataset as ProcessedCompetitionDataset;
    const metrics = buildAthleteMetrics(processed.normalized);
    const graph = buildGraphViewModel(
      processed.normalized,
      metrics,
      getAllAthletes(),
    );

    expect(processed.validationSummary.acceptedRows).toBe(1028);
    expect(processed.validationSummary.quarantinedRows).toBe(0);
    expect(processed.normalized.matches).toHaveLength(1058);
    expect(graph.edges).toHaveLength(1058);
    expect(graph.nodes.length).toBeGreaterThan(200);
    expect(graph.edges.some((edge) => edge.year === 2022)).toBe(true);
    expect(graph.edges.some((edge) => edge.year === 2024)).toBe(true);
    expect(graph.edges.some((edge) => edge.sex === 'F')).toBe(true);
    expect(graph.edges.some((edge) => edge.weightClass === '60KG')).toBe(true);
  });

  it('normalizes source IDs into stable canonical athlete and match IDs', () => {
    const csv = [
      'match_id;winner_id;winner_name;loser_id;loser_name;win_type;submission;winner_points;loser_points;adv_pen;weight_class;sex;stage;year',
      '3314;484;Murilo Santana;733;Vinicius Magalhaes;DECISION;;-1;-1;;ABS;M;4F;2011',
    ].join('\n');

    const rows = parseAdccHistoricalCsv(csv);
    const buildResult = buildAdccHistoricalSourceDataset(
      rows,
      Object.keys(rows[0]),
    );
    const normalized = normalizeAdccFixture(buildResult.sourceDataset);

    expect(normalized.athletes[0]?.id).toBe('athlete_484');
    expect(normalized.matches[0]?.id).toBe('match_3314');
    expect(normalized.events[0]).toMatchObject({
      name: 'ADCC World Championship',
      year: 2011,
    });
  });

  it('falls back to a name-based identity when the source athlete id is the -1 sentinel', () => {
    const csv = [
      'match_id;winner_id;winner_name;loser_id;loser_name;win_type;submission;winner_points;loser_points;adv_pen;weight_class;sex;stage;year',
      '13952;15283;Bianca Basilio;-1;E. Karppinen;POINTS;;0;0;;60KG;F;SF;2017',
      '35074;17402;Brianna Ste-Marie;-1;Elvira Karppinen;POINTS;;0;0;;60KG;F;4F;2022',
    ].join('\n');

    const rows = parseAdccHistoricalCsv(csv);
    const buildResult = buildAdccHistoricalSourceDataset(
      rows,
      Object.keys(rows[0]),
    );
    const normalized = normalizeAdccFixture(buildResult.sourceDataset);
    const karppinenAthletes = normalized.athletes.filter((athlete) =>
      athlete.name.includes('Karppinen'),
    );

    expect(karppinenAthletes).toHaveLength(2);
    expect(new Set(karppinenAthletes.map((athlete) => athlete.id)).size).toBe(
      2,
    );
    expect(
      karppinenAthletes.every((athlete) => athlete.sexes.includes('F')),
    ).toBe(true);
  });

  it('provides athlete diagnostics and exposes the Karppinen raw rows for inspection', () => {
    const processed = processedDataset as ProcessedCompetitionDataset;
    const diagnostics = buildAthleteDiagnostics(processed.normalized, 5);
    const rows = parseAdccHistoricalCsv(
      [
        'match_id;winner_id;winner_name;loser_id;loser_name;win_type;submission;winner_points;loser_points;adv_pen;weight_class;sex;stage;year',
        '13952;15283;Bianca Basilio;-1;E. Karppinen;POINTS;;0;0;;60KG;F;SF;2017',
        '35074;17402;Brianna Ste-Marie;-1;Elvira Karppinen;POINTS;;0;0;;60KG;F;4F;2022',
      ].join('\n'),
    );

    expect(diagnostics.topAthletesByMatchCount).toHaveLength(5);
    expect(
      diagnostics.topAthletesByMatchCount.every(
        (athlete) =>
          athlete.firstMatchYear >= 1998 && athlete.lastMatchYear <= 2022,
      ),
    ).toBe(true);
    expect(
      diagnostics.suspiciousAthletes.some((athlete) => athlete.matchCount > 40),
    ).toBe(true);

    const karppinenRows = findAthleteRowsByName(rows, 'karppinen');
    expect(karppinenRows).toHaveLength(2);
    expect(
      karppinenRows.every(
        (row) => row.sex === 'F' && row.weight_class === '60KG',
      ),
    ).toBe(true);
  });
});
