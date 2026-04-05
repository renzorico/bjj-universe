const MONTHS = new Set([
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]);

export interface ScrapedAdccPlacement {
  rank: number;
  athleteName: string;
}

export interface ScrapedAdccDivisionResult {
  divisionLabel: string;
  sex: 'M' | 'F' | null;
  weightClass: string | null;
  placements: ScrapedAdccPlacement[];
}

export interface ScrapedAdccOfficialResultsPage {
  sourceUrl: string;
  scrapedAt: string;
  eventTitle: string | null;
  organizer: string | null;
  location: string | null;
  eventDate: string | null;
  divisions: ScrapedAdccDivisionResult[];
}

export function parseAdccOfficialResultsPage(
  html: string,
  sourceUrl: string,
): ScrapedAdccOfficialResultsPage {
  const lines = extractTextLines(html);
  const resultsStart = lines.findIndex((line) => line === 'OFFICIAL RESULTS');
  const resultsEnd = lines.findIndex(
    (line, index) => index > resultsStart && line === 'BRACKETS',
  );
  const title = extractHeading(html, 'h1');
  const organizerIndex = lines.findIndex((line) => line.startsWith('Organized By:'));
  const organizer =
    organizerIndex >= 0
      ? lines[organizerIndex].replace(/^Organized By:\s*/, '')
      : null;
  const location =
    organizerIndex >= 0 ? lines[organizerIndex + 1] ?? null : null;
  const eventDate = extractEventDate(lines);
  const resultLines =
    resultsStart >= 0
      ? lines.slice(resultsStart + 1, resultsEnd >= 0 ? resultsEnd : undefined)
      : [];

  return {
    sourceUrl,
    scrapedAt: new Date().toISOString(),
    eventTitle: title,
    organizer,
    location,
    eventDate,
    divisions: parseDivisionResults(resultLines),
  };
}

function parseDivisionResults(lines: string[]): ScrapedAdccDivisionResult[] {
  const divisions: ScrapedAdccDivisionResult[] = [];
  let currentDivision: ScrapedAdccDivisionResult | null = null;

  lines.forEach((line) => {
    if (isDivisionLabel(line)) {
      currentDivision = {
        divisionLabel: line,
        ...parseDivisionLabel(line),
        placements: [],
      };
      divisions.push(currentDivision);
      return;
    }

    const placement = parsePlacement(
      line,
      currentDivision ? currentDivision.placements.length + 1 : 1,
    );

    if (placement && currentDivision) {
      currentDivision.placements.push(placement);
    }
  });

  return divisions.filter((division) => division.placements.length > 0);
}

function isDivisionLabel(line: string) {
  return (
    /^MALE\b/.test(line) ||
    /^FEMALE\b/.test(line) ||
    /^WOMEN\b/.test(line) ||
    /^MEN\b/.test(line) ||
    /^ABSOLUTE\b/.test(line) ||
    /^SUPERFIGHT\b/.test(line)
  );
}

function parseDivisionLabel(line: string): Pick<
  ScrapedAdccDivisionResult,
  'sex' | 'weightClass'
> {
  const normalized = line.toUpperCase();
  const sex = normalized.startsWith('MALE') || normalized.startsWith('MEN')
    ? 'M'
    : normalized.startsWith('FEMALE') || normalized.startsWith('WOMEN')
      ? 'F'
      : null;

  if (normalized.startsWith('SUPERFIGHT')) {
    return {
      sex,
      weightClass: 'SUPERFIGHT',
    };
  }

  if (normalized === 'ABSOLUTE') {
    return {
      sex: null,
      weightClass: 'ABS',
    };
  }

  const weightLabel = normalized
    .replace(/^MALE\s*/, '')
    .replace(/^FEMALE\s*/, '')
    .replace(/^MEN\s*/, '')
    .replace(/^WOMEN\s*/, '')
    .trim();

  if (weightLabel.includes('ABSOLUTE')) {
    return {
      sex,
      weightClass: 'ABS',
    };
  }

  return {
    sex,
    weightClass: weightLabel || null,
  };
}

function parsePlacement(
  line: string,
  fallbackRank: number,
): ScrapedAdccPlacement | null {
  const match = line.match(/^(\d+)\.\s*(.+)$/);

  if (match) {
    return {
      rank: Number.parseInt(match[1], 10),
      athleteName: cleanupName(match[2]),
    };
  }

  if (
    /^(SUPERFIGHT|BRACKETS?)$/i.test(line) ||
    /(?:def\.|via\s+\d)/i.test(line) ||
    !/[A-Za-z]/.test(line)
  ) {
    return null;
  }

  return {
    rank: fallbackRank,
    athleteName: cleanupName(line),
  };
}

function cleanupName(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+[-–]\s+.+$/, '')
    .replace(/\s+via\s+.+$/i, '')
    .replace(/\s+def\.$/i, '')
    .trim();
}

function extractTextLines(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|ul|ol|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractHeading(html: string, tag: 'h1' | 'h2') {
  const match = html.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  );

  if (!match) {
    return null;
  }

  return match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEventDate(lines: string[]) {
  for (let index = 0; index < lines.length - 2; index += 1) {
    const month = lines[index].slice(0, 3).toLowerCase();
    const day = lines[index + 1];
    const year = lines[index + 2];

    if (
      MONTHS.has(month) &&
      /^\d{1,2}$/.test(day) &&
      /^\d{4}$/.test(year)
    ) {
      return `${lines[index]} ${day}, ${year}`;
    }
  }

  return null;
}
