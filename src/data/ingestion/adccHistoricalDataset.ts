import { parse } from 'csv-parse/sync';
import { RawAdccFixture, RawAdccMatchRecord } from '@/domain/types';

export const ADCC_HISTORICAL_REQUIRED_COLUMNS = [
  'match_id',
  'winner_id',
  'winner_name',
  'loser_id',
  'loser_name',
  'win_type',
  'winner_points',
  'loser_points',
  'weight_class',
  'sex',
  'stage',
  'year',
] as const;

export const ADCC_HISTORICAL_OPTIONAL_COLUMNS = [
  'submission',
  'adv_pen',
] as const;

export type AdccHistoricalColumn =
  | (typeof ADCC_HISTORICAL_REQUIRED_COLUMNS)[number]
  | (typeof ADCC_HISTORICAL_OPTIONAL_COLUMNS)[number];

export type AdccHistoricalQuarantineReason =
  | 'missing_match_id'
  | 'missing_winner_id'
  | 'missing_winner_name'
  | 'missing_loser_id'
  | 'missing_loser_name'
  | 'missing_weight_class'
  | 'missing_stage'
  | 'missing_year'
  | 'invalid_year'
  | 'invalid_winner_points'
  | 'invalid_loser_points'
  | 'missing_sex';

export interface AdccHistoricalRawRow {
  match_id: string;
  winner_id: string;
  winner_name: string;
  loser_id: string;
  loser_name: string;
  win_type: string;
  submission: string;
  winner_points: string;
  loser_points: string;
  adv_pen: string;
  weight_class: string;
  sex: string;
  stage: string;
  year: string;
}

export interface AdccHistoricalQuarantinedRow {
  rowNumber: number;
  sourceMatchId: string | null;
  reasons: AdccHistoricalQuarantineReason[];
  raw: AdccHistoricalRawRow;
}

export interface AdccHistoricalValidationResult {
  detectedColumns: string[];
  requiredColumns: string[];
  optionalColumns: string[];
  totalRows: number;
  acceptedRows: number;
  quarantinedRows: number;
  quarantineReasons: Record<AdccHistoricalQuarantineReason, number>;
}

export interface AdccHistoricalBuildResult {
  sourceDataset: RawAdccFixture;
  validation: AdccHistoricalValidationResult;
  quarantine: AdccHistoricalQuarantinedRow[];
}

export function parseAdccHistoricalCsv(
  csvText: string,
): AdccHistoricalRawRow[] {
  const rows = parse<Record<string, string>>(csvText, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true,
  });

  return rows.map((row) => ({
    match_id: row.match_id ?? '',
    winner_id: row.winner_id ?? '',
    winner_name: row.winner_name ?? '',
    loser_id: row.loser_id ?? '',
    loser_name: row.loser_name ?? '',
    win_type: row.win_type ?? '',
    submission: row.submission ?? '',
    winner_points: row.winner_points ?? '',
    loser_points: row.loser_points ?? '',
    adv_pen: row.adv_pen ?? '',
    weight_class: row.weight_class ?? '',
    sex: row.sex ?? '',
    stage: row.stage ?? '',
    year: row.year ?? '',
  }));
}

export function validateAdccHistoricalSchema(columns: string[]): {
  missingRequiredColumns: string[];
  unexpectedColumns: string[];
} {
  const expectedColumns = new Set<string>([
    ...ADCC_HISTORICAL_REQUIRED_COLUMNS,
    ...ADCC_HISTORICAL_OPTIONAL_COLUMNS,
  ]);

  return {
    missingRequiredColumns: ADCC_HISTORICAL_REQUIRED_COLUMNS.filter(
      (column) => !columns.includes(column),
    ),
    unexpectedColumns: columns.filter((column) => !expectedColumns.has(column)),
  };
}

export function buildAdccHistoricalSourceDataset(
  rows: AdccHistoricalRawRow[],
  detectedColumns: string[],
): AdccHistoricalBuildResult {
  const quarantine: AdccHistoricalQuarantinedRow[] = [];
  const matches: RawAdccMatchRecord[] = [];
  const quarantineReasons = createEmptyQuarantineReasonCounter();

  rows.forEach((row, index) => {
    const reasons = collectQuarantineReasons(row);

    if (reasons.length > 0) {
      reasons.forEach((reason) => {
        quarantineReasons[reason] += 1;
      });

      quarantine.push({
        rowNumber: index + 2,
        sourceMatchId: row.match_id || null,
        reasons,
        raw: row,
      });
      return;
    }

    const year = Number.parseInt(row.year, 10);

    matches.push({
      sourceMatchId: row.match_id,
      event: {
        name: 'ADCC World Championship',
        year,
        inferredName: true,
      },
      sex: row.sex,
      weightClass: row.weight_class,
      winner: {
        name: row.winner_name,
      },
      loser: {
        name: row.loser_name,
      },
      winnerSourceId: row.winner_id,
      loserSourceId: row.loser_id,
      method: row.win_type,
      submission: normalizeOptionalValue(row.submission),
      round: row.stage,
      winnerPoints: parseInteger(row.winner_points),
      loserPoints: parseInteger(row.loser_points),
      advantagePenalty: normalizeOptionalValue(row.adv_pen),
    });
  });

  return {
    sourceDataset: {
      source: 'adcc-historical-kaggle',
      label: 'ADCC historical dataset',
      notes:
        'Kaggle source: bjagrelli/adcc-historical-dataset. Event names are derived from the source year because the raw CSV does not include an event name or location column.',
      matches,
    },
    validation: {
      detectedColumns,
      requiredColumns: [...ADCC_HISTORICAL_REQUIRED_COLUMNS],
      optionalColumns: [...ADCC_HISTORICAL_OPTIONAL_COLUMNS],
      totalRows: rows.length,
      acceptedRows: matches.length,
      quarantinedRows: quarantine.length,
      quarantineReasons,
    },
    quarantine,
  };
}

export function findAthleteRowsByName(
  rows: AdccHistoricalRawRow[],
  athleteNameFragment: string,
): AdccHistoricalRawRow[] {
  const normalizedFragment = athleteNameFragment.trim().toLowerCase();

  return rows.filter((row) => {
    return (
      row.winner_name.toLowerCase().includes(normalizedFragment) ||
      row.loser_name.toLowerCase().includes(normalizedFragment)
    );
  });
}

function collectQuarantineReasons(
  row: AdccHistoricalRawRow,
): AdccHistoricalQuarantineReason[] {
  const reasons: AdccHistoricalQuarantineReason[] = [];

  if (!row.match_id) reasons.push('missing_match_id');
  if (!row.winner_id) reasons.push('missing_winner_id');
  if (!row.winner_name) reasons.push('missing_winner_name');
  if (!row.loser_id) reasons.push('missing_loser_id');
  if (!row.loser_name) reasons.push('missing_loser_name');
  if (!row.weight_class) reasons.push('missing_weight_class');
  if (!row.sex) reasons.push('missing_sex');
  if (!row.stage) reasons.push('missing_stage');
  if (!row.year) reasons.push('missing_year');

  const year = Number.parseInt(row.year, 10);
  if (row.year && (Number.isNaN(year) || year < 1998 || year > 2100)) {
    reasons.push('invalid_year');
  }

  if (!isIntegerLike(row.winner_points)) {
    reasons.push('invalid_winner_points');
  }

  if (!isIntegerLike(row.loser_points)) {
    reasons.push('invalid_loser_points');
  }

  return reasons;
}

function isIntegerLike(value: string): boolean {
  return /^-?\d+$/.test(value);
}

function parseInteger(value: string): number | undefined {
  if (!isIntegerLike(value)) {
    return undefined;
  }

  return Number.parseInt(value, 10);
}

function normalizeOptionalValue(value: string): string | undefined {
  const normalized = value.trim();

  if (!normalized || normalized === 'N/A') {
    return undefined;
  }

  return normalized;
}

function createEmptyQuarantineReasonCounter(): Record<
  AdccHistoricalQuarantineReason,
  number
> {
  return {
    invalid_loser_points: 0,
    invalid_winner_points: 0,
    invalid_year: 0,
    missing_loser_id: 0,
    missing_loser_name: 0,
    missing_match_id: 0,
    missing_sex: 0,
    missing_stage: 0,
    missing_weight_class: 0,
    missing_winner_id: 0,
    missing_winner_name: 0,
    missing_year: 0,
  };
}
