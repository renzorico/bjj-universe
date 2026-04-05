import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildAthleteEnrichmentTargets } from '../src/data/enrichment/buildAthleteEnrichmentTargets';
import { ProcessedCompetitionDataset } from '../src/domain/types';

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const processedDataset = JSON.parse(
    await readFile(
      path.join(projectRoot, 'src/data/processed/adcc-historical.processed.json'),
      'utf8',
    ),
  ) as ProcessedCompetitionDataset;
  const targets = buildAthleteEnrichmentTargets(processedDataset.normalized, 10);
  const outputDir = path.join(projectRoot, 'data/processed/adcc');

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, 'adcc-historical.enrichment-targets.json'),
    `${JSON.stringify(targets, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        targetCount: targets.length,
        output: path.join(outputDir, 'adcc-historical.enrichment-targets.json'),
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
