import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildAthleteManualEnrichmentRows } from '../src/data/export/buildAthleteManualEnrichmentRows';
import { ProcessedCompetitionDataset } from '../src/domain/types';

const ALL_ATHLETES_OUTPUT =
  'data/processed/adcc/adcc-athletes-for-manual-enrichment.csv';
const GT10_OUTPUT =
  'data/processed/adcc/adcc-athletes-for-manual-enrichment-gt10.csv';

function escapeCsv(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const stringValue = String(value);

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function toCsv(
  rows: ReturnType<typeof buildAthleteManualEnrichmentRows>,
): string {
  const header = [
    'canonical_athlete_id',
    'name',
    'sex',
    'primary_weight_class',
    'active_year_first',
    'active_year_last',
    'total_matches',
  ];

  const lines = rows.map((row) =>
    [
      row.canonicalAthleteId,
      row.name,
      row.sex,
      row.primaryWeightClass,
      row.activeYearFirst,
      row.activeYearLast,
      row.totalMatches,
    ]
      .map((value) => escapeCsv(value))
      .join(','),
  );

  return `${header.join(',')}\n${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const processedDataset = JSON.parse(
    await readFile(
      path.join(projectRoot, 'src/data/processed/adcc-historical.processed.json'),
      'utf8',
    ),
  ) as ProcessedCompetitionDataset;
  const rows = buildAthleteManualEnrichmentRows(processedDataset.normalized);
  const outputDir = path.join(projectRoot, 'data/processed/adcc');
  const allAthletesPath = path.join(projectRoot, ALL_ATHLETES_OUTPUT);
  const gt10Path = path.join(projectRoot, GT10_OUTPUT);

  await mkdir(outputDir, { recursive: true });
  await writeFile(allAthletesPath, toCsv(rows));
  await writeFile(
    gt10Path,
    toCsv(rows.filter((row) => row.totalMatches > 10)),
  );

  console.log(
    JSON.stringify(
      {
        athleteCount: rows.length,
        output: ALL_ATHLETES_OUTPUT,
        gt10AthleteCount: rows.filter((row) => row.totalMatches > 10).length,
        gt10Output: GT10_OUTPUT,
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
