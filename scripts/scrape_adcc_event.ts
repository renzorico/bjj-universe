import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseAdccOfficialResultsPage } from '../src/data/scraping/parseAdccOfficialResultsPage';

const DEFAULT_URL =
  'https://adcombat.com/adcc-events/adcc-submission-fighting-world-championship-2024/';
const DEFAULT_SLUG = 'adcc-worlds-2024-official-results';

async function main(): Promise<void> {
  const args = new Map<string, string>();

  process.argv.slice(2).forEach((argument, index, all) => {
    if (argument.startsWith('--')) {
      args.set(argument.slice(2), all[index + 1] ?? '');
    }
  });

  const sourceUrl = args.get('url') || DEFAULT_URL;
  const slug = args.get('slug') || DEFAULT_SLUG;
  const projectRoot = process.cwd();
  const rawDir = path.join(projectRoot, 'data/raw/adcc/scraped-events');
  const processedDir = path.join(projectRoot, 'data/processed/adcc/scraped-events');

  const response = await fetch(sourceUrl, {
    headers: {
      'user-agent': 'bjj-universe/0.1 (+https://github.com/renzorico/bjj-universe)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
  }

  const html = await response.text();
  const parsed = parseAdccOfficialResultsPage(html, sourceUrl);

  await mkdir(rawDir, { recursive: true });
  await mkdir(processedDir, { recursive: true });
  await writeFile(path.join(rawDir, `${slug}.html`), html);
  await writeFile(
    path.join(processedDir, `${slug}.json`),
    `${JSON.stringify(parsed, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        slug,
        sourceUrl,
        eventTitle: parsed.eventTitle,
        divisions: parsed.divisions.length,
        output: path.join(processedDir, `${slug}.json`),
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
