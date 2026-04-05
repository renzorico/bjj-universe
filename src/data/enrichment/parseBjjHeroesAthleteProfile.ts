import {
  AthleteMetadataEnrichmentRecord,
  AthleteMetadataField,
  AthleteMetadataSourceManifestEntry,
} from '@/data/enrichment/types';

const COUNTRY_CODE_MAP: Record<string, string> = {
  USA: 'United States',
  BRA: 'Brazil',
  AUS: 'Australia',
  CAN: 'Canada',
  JPN: 'Japan',
};

export function parseBjjHeroesAthleteProfile(
  html: string,
  source: AthleteMetadataSourceManifestEntry,
): AthleteMetadataEnrichmentRecord {
  const lines = extractTextLines(html);
  const extractedAt = new Date().toISOString();
  const nationality = extractNationality(lines, source, extractedAt);
  const academy = extractAcademy(lines, source, extractedAt);

  return {
    athleteId: source.athleteId,
    athleteName: source.athleteName,
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    status: nationality || academy ? 'enriched' : 'missing_fields',
    nationality,
    academy,
  };
}

function extractAcademy(
  lines: string[],
  source: AthleteMetadataSourceManifestEntry,
  extractedAt: string,
): AthleteMetadataField | undefined {
  const line = lines.find((entry) => /^Team\/Association:/i.test(entry));

  if (!line) {
    return undefined;
  }

  return {
    value: line.replace(/^Team\/Association:\s*/i, '').trim(),
    confidence: 'high',
    provenance: {
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      extractedAt,
    },
  };
}

function extractNationality(
  lines: string[],
  source: AthleteMetadataSourceManifestEntry,
  extractedAt: string,
): AthleteMetadataField | undefined {
  const countryLine = lines.find(
    (entry) =>
      /\(([A-Z]{3})\)\s+born grappler/i.test(entry) ||
      /born .* – [A-Za-z ]+\./i.test(entry),
  );

  if (!countryLine) {
    return undefined;
  }

  const codeMatch = countryLine.match(/\(([A-Z]{3})\)\s+born grappler/i);

  if (codeMatch) {
    return {
      value: COUNTRY_CODE_MAP[codeMatch[1]] ?? codeMatch[1],
      confidence: COUNTRY_CODE_MAP[codeMatch[1]] ? 'medium' : 'low',
      provenance: {
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        extractedAt,
      },
    };
  }

  const countryMatch = countryLine.match(/born .* – ([A-Za-z ]+)\./i);

  if (!countryMatch) {
    return undefined;
  }

  return {
    value: countryMatch[1].trim(),
    confidence: 'medium',
    provenance: {
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      extractedAt,
    },
  };
}

function extractTextLines(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h1|h2|h3|h4|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
