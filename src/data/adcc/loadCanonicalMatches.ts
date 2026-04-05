import matchMappingCsv from '../processed/adcc_match_athlete_mapping.csv?raw';
import { loadProcessedCompetitionDataset } from '@/data/validation/loadProcessedCompetitionDataset';
import { CanonicalAdccMatch } from '@/domain/types';

const processedDataset = loadProcessedCompetitionDataset();

interface CanonicalMatchMappingRow {
  match_id: string;
  role: 'winner' | 'loser';
  canonical_athlete_id: string;
  sex: string;
  weight_class: string;
  year: string;
}

let cachedMatches: CanonicalAdccMatch[] | null = null;

export function getAllCanonicalMatches(): CanonicalAdccMatch[] {
  if (cachedMatches) {
    return cachedMatches;
  }

  const rows = parseMappingCsv(matchMappingCsv);
  const processedMatchBySourceId = new Map(
    processedDataset.normalized.matches.map((match) => [
      match.sourceMatchId,
      match,
    ]),
  );
  const eventById = new Map(
    processedDataset.normalized.events.map((event) => [event.id, event]),
  );
  const groupedMatches = new Map<
    string,
    Partial<Record<'winner' | 'loser', CanonicalMatchMappingRow>>
  >();

  for (const row of rows) {
    const entry = groupedMatches.get(row.match_id) ?? {};
    entry[row.role] = row;
    groupedMatches.set(row.match_id, entry);
  }

  cachedMatches = [...groupedMatches.entries()]
    .flatMap(([sourceMatchId, participants]) => {
      const winner = participants.winner;
      const loser = participants.loser;

      if (!winner || !loser) {
        return [];
      }

      const processedMatch = processedMatchBySourceId.get(sourceMatchId);
      const eventId =
        processedMatch?.eventId ??
        `event_adcc-world-championship-${winner.year}`;
      const event = eventById.get(eventId);

      return [
        {
          id: processedMatch?.id ?? `match_${sourceMatchId}`,
          sourceMatchId,
          eventId,
          eventName: event?.name ?? 'ADCC World Championship',
          year:
            processedMatch && event
              ? event.year
              : Number.parseInt(winner.year, 10),
          winnerCanonicalId: winner.canonical_athlete_id,
          loserCanonicalId: loser.canonical_athlete_id,
          sex: processedMatch?.sex ?? winner.sex,
          weightClass: processedMatch?.weightClass ?? winner.weight_class,
          method: processedMatch?.method,
          roundLabel: processedMatch?.roundLabel,
        },
      ];
    })
    .sort((left, right) => {
      if (left.year !== right.year) {
        return left.year - right.year;
      }

      return left.sourceMatchId.localeCompare(right.sourceMatchId);
    });

  return cachedMatches;
}

function parseMappingCsv(csvText: string): CanonicalMatchMappingRow[] {
  const [headerLine, ...dataLines] = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!headerLine) {
    throw new Error('Canonical match mapping CSV is empty.');
  }

  const columns = parseCsvLine(headerLine);
  const requiredColumns = [
    'match_id',
    'role',
    'canonical_athlete_id',
    'sex',
    'weight_class',
    'year',
  ];
  const missingColumns = requiredColumns.filter(
    (column) => !columns.includes(column),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Canonical match mapping CSV is missing expected columns: ${missingColumns.join(', ')}`,
    );
  }

  return dataLines.map((line, index) => {
    const values = parseCsvLine(line);

    if (values.length !== columns.length) {
      throw new Error(
        `Canonical match mapping CSV row ${index + 2} has ${values.length} columns; expected ${columns.length}.`,
      );
    }

    const row = Object.fromEntries(
      columns.map((column, columnIndex) => [column, values[columnIndex] ?? '']),
    ) as Record<string, string>;

    return {
      match_id: row.match_id,
      role: row.role === 'winner' ? 'winner' : 'loser',
      canonical_athlete_id: row.canonical_athlete_id,
      sex: row.sex,
      weight_class: row.weight_class,
      year: row.year,
    };
  });
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
    throw new Error(
      'Canonical match mapping CSV contains an unterminated quoted value.',
    );
  }

  values.push(currentValue.trim());
  return values;
}
