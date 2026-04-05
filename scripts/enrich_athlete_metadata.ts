import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseBjjHeroesAthleteProfile } from '../src/data/enrichment/parseBjjHeroesAthleteProfile';
import {
  AthleteMetadataEnrichmentRecord,
  AthleteMetadataSourceManifestEntry,
} from '../src/data/enrichment/types';

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const manifestPath = path.join(
    projectRoot,
    'data/raw/adcc/athlete-metadata-source-manifest.json',
  );
  const rawDir = path.join(projectRoot, 'data/raw/adcc/athlete-metadata');
  const outputPath = path.join(
    projectRoot,
    'data/processed/adcc/adcc-historical.athlete-metadata.json',
  );
  const manifest = JSON.parse(
    await readFile(manifestPath, 'utf8'),
  ) as AthleteMetadataSourceManifestEntry[];
  const records: AthleteMetadataEnrichmentRecord[] = [];

  await mkdir(rawDir, { recursive: true });
  await mkdir(path.dirname(outputPath), { recursive: true });

  for (const source of manifest) {
    const response = await fetch(source.sourceUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.8',
      },
    });

    if (!response.ok) {
      records.push({
        athleteId: source.athleteId,
        athleteName: source.athleteName,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        status: 'blocked',
        notes: [`HTTP ${response.status} ${response.statusText}`],
      });
      continue;
    }

    const html = await response.text();
    const slug = `${source.athleteId}-${source.sourceName}`;

    await writeFile(path.join(rawDir, `${slug}.html`), html);

    if (source.sourceName === 'bjjheroes') {
      records.push(parseBjjHeroesAthleteProfile(html, source));
    }
  }

  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        records: records.length,
        output: outputPath,
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
