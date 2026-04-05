import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildAdccHistoricalSourceDataset,
  parseAdccHistoricalCsv,
  validateAdccHistoricalSchema,
} from '../src/data/ingestion/adccHistoricalDataset';
import { buildAdccCleaningLayer } from '../src/data/cleaning/buildAdccCleaningLayer';
import { buildAthleteEnrichmentTargets } from '../src/data/enrichment/buildAthleteEnrichmentTargets';
import { normalizeAdccFixture } from '../src/data/normalization/normalizeAdccFixture';
import {
  buildAdccEventReconciliation,
  ReconciliationManifestEntry,
  renderAdccEventReconciliationMarkdown,
} from '../src/data/reconciliation/buildAdccEventReconciliation';
import { promoteOfficialResultsToFixture } from '../src/data/reconciliation/promoteOfficialResultsToFixture';
import { buildAthleteDiagnostics } from '../src/data/validation/buildAthleteDiagnostics';
import {
  buildAdccIntegrityReport,
  renderAdccIntegrityReportMarkdown,
} from '../src/data/validation/buildAdccIntegrityReport';
import { ScrapedAdccOfficialResultsPage } from '../src/data/scraping/parseAdccOfficialResultsPage';
import { ProcessedCompetitionDataset } from '../src/domain/types';

const projectRoot = process.cwd();
const rawCsvPath = path.join(
  projectRoot,
  'data/raw/adcc/adcc_historical_data.csv',
);
const processedDir = path.join(projectRoot, 'data/processed/adcc');
const reconciliationDir = path.join(processedDir, 'reconciliation');
const officialResultsManifestPath = path.join(
  projectRoot,
  'data/raw/adcc/official-results-manifest.json',
);
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
  const reconciliationManifest = JSON.parse(
    await readFile(officialResultsManifestPath, 'utf8'),
  ) as ReconciliationManifestEntry[];
  const reconciliationArtifacts = await Promise.all(
    reconciliationManifest.map(async (entry) => {
      const officialParsed = JSON.parse(
        await readFile(path.join(projectRoot, entry.officialParsedPath), 'utf8'),
      ) as ScrapedAdccOfficialResultsPage;

      return {
        entry,
        artifact: buildAdccEventReconciliation(entry, officialParsed, sourceDataset),
      };
    }),
  );
  const promotedFixture = promoteOfficialResultsToFixture(
    sourceDataset,
    reconciliationArtifacts.map(({ artifact }) => artifact),
  );
  const cleaningLayer = buildAdccCleaningLayer(promotedFixture);
  const normalized = normalizeAdccFixture(promotedFixture);
  const athleteDiagnostics = buildAthleteDiagnostics(normalized, 15);
  const integrityReport = buildAdccIntegrityReport(promotedFixture, normalized);
  const enrichmentTargets = buildAthleteEnrichmentTargets(normalized, 10);

  const processedDataset: ProcessedCompetitionDataset = {
    source: sourceDataset.source,
    label: promotedFixture.label,
    notes: promotedFixture.notes,
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
      athleteSpanWarnings: {
        outOfBoundsCount: athleteDiagnostics.outOfBoundsCount,
        overlongSpanCount: athleteDiagnostics.overlongSpanCount,
        suspiciousAthletes: athleteDiagnostics.suspiciousAthletes,
      },
    },
    normalized,
  };

  await mkdir(processedDir, { recursive: true });
  await mkdir(reconciliationDir, { recursive: true });
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
    path.join(processedDir, 'adcc-historical.athlete-diagnostics.json'),
    `${JSON.stringify(athleteDiagnostics, null, 2)}\n`,
  );
  await writeFile(
    path.join(processedDir, 'adcc-historical.integrity-report.json'),
    `${JSON.stringify(integrityReport, null, 2)}\n`,
  );
  await writeFile(
    path.join(processedDir, 'adcc-historical.integrity-report.md'),
    renderAdccIntegrityReportMarkdown(integrityReport),
  );
  await writeFile(
    path.join(processedDir, 'adcc-historical.cleaned-layer.json'),
    `${JSON.stringify(cleaningLayer, null, 2)}\n`,
  );
  for (const { entry, artifact } of reconciliationArtifacts) {
    await writeFile(
      path.join(reconciliationDir, `${entry.slug}.reconciliation.json`),
      `${JSON.stringify(artifact, null, 2)}\n`,
    );
    await writeFile(
      path.join(reconciliationDir, `${entry.slug}.reconciliation.md`),
      renderAdccEventReconciliationMarkdown(artifact),
    );
  }
  await writeFile(
    path.join(processedDir, 'adcc-historical.enrichment-targets.json'),
    `${JSON.stringify(enrichmentTargets, null, 2)}\n`,
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
        suspiciousAthletes: athleteDiagnostics.suspiciousAthletes.length,
        crossSexAthletes: integrityReport.anomalies.crossSexAthletes.length,
        missingWorldEvents: integrityReport.anomalies.missingWorldEvents.map(
          (event) => event.year,
        ),
        reconciledEvents: reconciliationArtifacts.map(({ entry, artifact }) => ({
          slug: entry.slug,
          officialOnly: artifact.summary.officialOnly,
          exactMatches: artifact.summary.exactMatches,
          likelyMatches: artifact.summary.likelyMatches,
          mismatches: artifact.summary.mismatches,
        })),
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
