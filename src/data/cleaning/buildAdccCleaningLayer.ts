import { RawAdccFixture, RawAdccMatchRecord } from '@/domain/types';
import { slugify } from '@/lib/slugify';
import {
  CleanedAdccDataset,
  CleanedAthleteRecord,
  CleanedEventRecord,
  CleanedMatchRecord,
  CleaningFlag,
  SourceProvenance,
} from '@/data/cleaning/types';

export function buildAdccCleaningLayer(
  fixture: RawAdccFixture,
): CleanedAdccDataset {
  const athletes = new Map<string, CleanedAthleteRecord>();
  const events = new Map<string, CleanedEventRecord>();
  const matches: CleanedMatchRecord[] = [];
  const quarantine: CleaningFlag[] = [];

  fixture.matches.forEach((match, index) => {
    const eventId = resolveEventId(match);
    const eventProvenance = createProvenance(match, 'event');

    if (!events.has(eventId)) {
      events.set(eventId, {
        canonicalEventId: eventId,
        displayName: match.event.name,
        year: match.event.year,
        location: match.event.location,
        provenance: [eventProvenance],
      });
    }

    const winner = registerAthlete(athletes, match, 'winner');
    const loser = registerAthlete(athletes, match, 'loser');
    const canonicalMatchId = match.sourceMatchId
      ? `match_${match.sourceMatchId}`
      : `match_clean_${index + 1}`;
    const matchFlags = [...winner.newFlags, ...loser.newFlags].map((flag) => ({
      ...flag,
      matchId: canonicalMatchId,
    }));

    quarantine.push(...matchFlags.filter((flag) => flag.severity !== 'info'));

    matches.push({
      canonicalMatchId,
      winnerAthleteId: winner.canonicalAthleteId,
      loserAthleteId: loser.canonicalAthleteId,
      eventId,
      sex: match.sex ?? null,
      weightClass: match.weightClass ?? null,
      method: match.method,
      submission: match.submission,
      roundLabel: match.round,
      provenance: [createProvenance(match, 'match')],
      flags: matchFlags,
    });
  });

  const athleteFlags = [...athletes.values()].flatMap((athlete) =>
    athlete.flags.filter((flag) => flag.severity !== 'info'),
  );

  quarantine.push(...athleteFlags);

  return {
    generatedAt: new Date().toISOString(),
    source: fixture.source,
    athletes: [...athletes.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    ),
    events: [...events.values()].sort((left, right) => left.year - right.year),
    matches,
    quarantine: dedupeFlags(quarantine),
  };
}

function registerAthlete(
  registry: Map<string, CleanedAthleteRecord>,
  match: RawAdccMatchRecord,
  side: 'winner' | 'loser',
): {
  canonicalAthleteId: string;
  newFlags: CleaningFlag[];
} {
  const athlete =
    side === 'winner'
      ? {
          sourceAthleteId: match.winnerSourceId,
          name: match.winner.name,
        }
      : {
          sourceAthleteId: match.loserSourceId,
          name: match.loser.name,
        };
  const canonicalAthleteId = resolveAthleteId(
    athlete.name,
    match.sex,
    athlete.sourceAthleteId,
  );
  const provenance = createProvenance(
    match,
    side === 'winner' ? 'winner' : 'loser',
    athlete.sourceAthleteId,
  );
  const existing = registry.get(canonicalAthleteId);
  const newFlags: CleaningFlag[] = [];

  if (!existing) {
    const initialFlags = buildInitialAthleteFlags(
      canonicalAthleteId,
      athlete.name,
      match,
      athlete.sourceAthleteId,
    );

    registry.set(canonicalAthleteId, {
      canonicalAthleteId,
      displayName: athlete.name,
      aliases: [athlete.name],
      sexes: match.sex ? [match.sex] : [],
      weightClasses: match.weightClass ? [match.weightClass] : [],
      sourceAthleteIds:
        athlete.sourceAthleteId && athlete.sourceAthleteId !== '-1'
          ? [athlete.sourceAthleteId]
          : [],
      provenance: [provenance],
      flags: initialFlags,
    });
    newFlags.push(...initialFlags);

    return { canonicalAthleteId, newFlags };
  }

  if (!existing.aliases.includes(athlete.name)) {
    existing.aliases.push(athlete.name);
  }

  if (match.sex && !existing.sexes.includes(match.sex)) {
    existing.sexes.push(match.sex);
  }

  if (match.weightClass && !existing.weightClasses.includes(match.weightClass)) {
    existing.weightClasses.push(match.weightClass);
  }

  if (
    athlete.sourceAthleteId &&
    athlete.sourceAthleteId !== '-1' &&
    !existing.sourceAthleteIds.includes(athlete.sourceAthleteId)
  ) {
    existing.sourceAthleteIds.push(athlete.sourceAthleteId);
  }

  existing.provenance.push(provenance);

  const conflictFlags = buildConflictFlags(existing, provenance);
  conflictFlags.forEach((flag) => {
    if (
      !existing.flags.some(
        (existingFlag) =>
          existingFlag.code === flag.code &&
          existingFlag.message === flag.message,
      )
    ) {
      existing.flags.push(flag);
      newFlags.push(flag);
    }
  });

  return { canonicalAthleteId, newFlags };
}

function buildInitialAthleteFlags(
  canonicalAthleteId: string,
  athleteName: string,
  match: RawAdccMatchRecord,
  sourceAthleteId?: string,
): CleaningFlag[] {
  const flags: CleaningFlag[] = [];

  if (!sourceAthleteId || sourceAthleteId === '-1') {
    flags.push({
      code: 'missing_source_athlete_id',
      severity: 'warning',
      athleteId: canonicalAthleteId,
      message: `${athleteName} is missing a stable source athlete id; using a name-based canonical id.`,
      provenance: [
        createProvenance(
          match,
          'athlete',
          sourceAthleteId,
          'sourceAthleteId',
        ),
      ],
    });
    flags.push({
      code: 'name_based_identity',
      severity: 'info',
      athleteId: canonicalAthleteId,
      message: `${athleteName} currently resolves to a name-based identity.`,
      provenance: [
        createProvenance(match, 'athlete', sourceAthleteId, 'canonicalAthleteId'),
      ],
    });
  }

  return flags;
}

function buildConflictFlags(
  athlete: CleanedAthleteRecord,
  provenance: SourceProvenance,
): CleaningFlag[] {
  const flags: CleaningFlag[] = [];

  if (athlete.aliases.length > 1 && athlete.sourceAthleteIds.length > 0) {
    flags.push({
      code: 'source_id_multiple_names',
      severity: 'warning',
      athleteId: athlete.canonicalAthleteId,
      message: `${athlete.canonicalAthleteId} is tied to multiple observed names: ${athlete.aliases.join(', ')}.`,
      provenance: [provenance],
    });
  }

  if (athlete.sexes.length > 1) {
    flags.push({
      code: athlete.sourceAthleteIds.length > 0
        ? 'source_id_cross_sex'
        : 'cross_sex_candidate',
      severity: 'error',
      athleteId: athlete.canonicalAthleteId,
      message: `${athlete.canonicalAthleteId} appears in multiple sexes: ${athlete.sexes.join(', ')}.`,
      provenance: [provenance],
    });
  }

  return flags;
}

function createProvenance(
  match: RawAdccMatchRecord,
  source: string,
  sourceAthleteId?: string,
  field?: string,
): SourceProvenance {
  return {
    source,
    sourceMatchId: match.sourceMatchId,
    sourceAthleteId:
      sourceAthleteId && sourceAthleteId !== '-1' ? sourceAthleteId : undefined,
    sourceEventName: match.event.name,
    year: match.event.year,
    field,
  };
}

function resolveEventId(match: RawAdccMatchRecord) {
  return `event_${slugify(`${match.event.name}-${match.event.year}`)}`;
}

function resolveAthleteId(name: string, sex?: string, sourceAthleteId?: string) {
  if (sourceAthleteId && sourceAthleteId !== '-1') {
    return `athlete_${sourceAthleteId}`;
  }

  const suffix = sex ? `-${sex}` : '';
  return `athlete_clean_${slugify(`${name}${suffix}`)}`;
}

function dedupeFlags(flags: CleaningFlag[]) {
  const seen = new Set<string>();

  return flags.filter((flag) => {
    const key = `${flag.code}:${flag.athleteId ?? ''}:${flag.matchId ?? ''}:${flag.message}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
