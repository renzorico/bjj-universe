import {
  buildAdccHistoricalSourceDataset,
  parseAdccHistoricalCsv,
  validateAdccHistoricalSchema,
} from '@/data/ingestion/adccHistoricalDataset';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import processedDataset from '@/data/processed/adcc-historical.processed.json';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
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
      division: 'M 99KG',
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
    const graph = buildGraphViewModel(processed.normalized, metrics);

    expect(processed.validationSummary.acceptedRows).toBe(1028);
    expect(processed.validationSummary.quarantinedRows).toBe(0);
    expect(processed.normalized.matches).toHaveLength(1028);
    expect(graph.edges).toHaveLength(1028);
    expect(graph.nodes.length).toBeGreaterThan(200);
    expect(graph.edges.some((edge) => edge.year === 2022)).toBe(true);
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
});
