import athletesCsv from '../processed/adcc_athletes_final.csv?raw';
import { AdccAthlete } from '@/domain/types';

export const ADCC_ATHLETE_EXPECTED_COLUMNS = [
  'canonical_athlete_id',
  'name',
  'sex',
  'primary_weight_class',
  'active_year_first',
  'active_year_last',
  'total_matches',
  'nationality',
  'team',
] as const;

type AdccAthleteCsvColumn = (typeof ADCC_ATHLETE_EXPECTED_COLUMNS)[number];

type AdccAthleteCsvRow = Record<AdccAthleteCsvColumn, string>;

let cachedAthletes: AdccAthlete[] | null = null;

export function getAllAthletes(): AdccAthlete[] {
  if (cachedAthletes) {
    return cachedAthletes;
  }

  cachedAthletes = parseAthleteRecords(
    athletesCsv,
    'ADCC final athlete CSV',
    ADCC_ATHLETE_EXPECTED_COLUMNS,
  );

  return cachedAthletes;
}

function parseAthleteRecords(
  csvText: string,
  sourceLabel: string,
  expectedColumns: readonly string[],
): AdccAthlete[] {
  const rows = parseAthleteCsv(csvText);

  if (rows.length === 0) {
    throw new Error(`${sourceLabel} is empty.`);
  }

  const detectedColumns = rows[0];
  validateAthleteColumns(detectedColumns, sourceLabel, expectedColumns);

  return rows.slice(1).map((values, index) => {
    const athleteRow = buildAthleteRow(values, detectedColumns, index + 2, sourceLabel);

    return {
      canonicalAthleteId: athleteRow.canonical_athlete_id,
      name: athleteRow.name,
      sex: athleteRow.sex,
      primaryWeightClass: athleteRow.primary_weight_class,
      activeYearFirst: parseRequiredInteger(
        athleteRow.active_year_first,
        'active_year_first',
        athleteRow.canonical_athlete_id,
        sourceLabel,
      ),
      activeYearLast: parseRequiredInteger(
        athleteRow.active_year_last,
        'active_year_last',
        athleteRow.canonical_athlete_id,
        sourceLabel,
      ),
      totalMatches: parseRequiredInteger(
        athleteRow.total_matches,
        'total_matches',
        athleteRow.canonical_athlete_id,
        sourceLabel,
      ),
      nationality: normalizeOptionalValue(athleteRow.nationality ?? ''),
      team: normalizeOptionalValue(athleteRow.team ?? ''),
    };
  });
}

function parseAthleteCsv(csvText: string): string[][] {
  return csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  if (inQuotes) {
    throw new Error('ADCC athlete CSV contains an unterminated quoted value.');
  }

  values.push(currentValue.trim());
  return values;
}

function buildAthleteRow(
  values: string[],
  columns: string[],
  rowNumber: number,
  sourceLabel: string,
): AdccAthleteCsvRow {
  if (values.length !== columns.length) {
    throw new Error(
      `${sourceLabel} row ${rowNumber} has ${values.length} columns; expected ${columns.length}.`,
    );
  }

  const row = Object.fromEntries(
    columns.map((column, index) => [column, values[index] ?? '']),
  ) as Record<string, string>;

  return row as AdccAthleteCsvRow;
}

function validateAthleteColumns(
  columns: string[],
  sourceLabel: string,
  expectedColumns: readonly string[],
): void {
  const missingColumns = expectedColumns.filter(
    (column) => !columns.includes(column),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `${sourceLabel} is missing expected columns: ${missingColumns.join(', ')}`,
    );
  }
}

function parseRequiredInteger(
  rawValue: string,
  fieldName: string,
  athleteId: string,
  sourceLabel: string,
): number {
  const value = Number.parseInt(rawValue, 10);

  if (Number.isNaN(value)) {
    throw new Error(
      `${sourceLabel} has invalid ${fieldName} for ${athleteId}: ${rawValue}`,
    );
  }

  return value;
}

function normalizeOptionalValue(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
