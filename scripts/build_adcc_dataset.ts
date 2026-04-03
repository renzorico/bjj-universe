import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildAdccHistoricalSourceDataset,
  parseAdccHistoricalCsv,
  validateAdccHistoricalSchema,
} from '../src/data/ingestion/adccHistoricalDataset';
import { normalizeAdccFixture } from '../src/data/normalization/normalizeAdccFixture';
import { ProcessedCompetitionDataset } from '../src/domain/types';

const projectRoot = process.cwd();
const rawCsvPath = path.join(
  projectRoot,
  'data/raw/adcc/adcc_historical_data.csv',
);
const processedDir = path.join(projectRoot, 'data/processed/adcc');
const frontendProcessedPath = path.join(
  projectRoot,
  'src/data/processed/adcc-historical.processed.json',
);

async function main(): Promise<void> {
  const csvText = await readFile(rawCsvPath, 'utf8');
  const headerColumns = csvText.split('\n')[0].trim().split(';');
  const schemaCheck = validateAdccHistoricalSchema(headerColumns);

  if (schemaCheck.missingRequiredColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${schemaCheck.missingRequiredColumns.join(', ')}`,
    );
  }

  const rows = parseAdccHistoricalCsv(csvText);
  const buildResult = buildAdccHistoricalSourceDataset(rows, headerColumns);
  const { sourceDataset, validation, quarantine } = buildResult;
  const normalized = normalizeAdccFixture(sourceDataset);

  const processedDataset: ProcessedCompetitionDataset = {
    source: sourceDataset.source,
    label: sourceDataset.label,
    notes: sourceDataset.notes,
    schema: {
      detectedColumns: validation.detectedColumns,
      requiredColumns: validation.requiredColumns,
      optionalColumns: validation.optionalColumns,
    },
    validationSummary: {
      totalRows: validation.totalRows,
      acceptedRows: validation.acceptedRows,
      quarantinedRows: validation.quarantinedRows,
      quarantineReasons: validation.quarantineReasons,
    },
    normalized,
  };

  await mkdir(processedDir, { recursive: true });
  await mkdir(path.dirname(frontendProcessedPath), { recursive: true });

  await writeFile(
    path.join(processedDir, 'adcc-historical.validation-summary.json'),
    `${JSON.stringify(validation, null, 2)}\n`,
  );
  await writeFile(
    path.join(processedDir, 'adcc-historical.quarantine.json'),
    `${JSON.stringify(quarantine, null, 2)}\n`,
  );
  await writeFile(
    path.join(processedDir, 'adcc-historical.schema.json'),
    `${JSON.stringify(schemaCheck, null, 2)}\n`,
  );
  await writeFile(
    frontendProcessedPath,
    `${JSON.stringify(processedDataset, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        acceptedRows: validation.acceptedRows,
        quarantinedRows: validation.quarantinedRows,
        output: frontendProcessedPath,
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
