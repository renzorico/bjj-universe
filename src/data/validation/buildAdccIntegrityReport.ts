import { ADCC_WORLD_CHAMPIONSHIP_EVENT_REFERENCES } from '@/data/adcc/adccWorldChampionshipEvents';
import { buildAthleteDiagnostics } from '@/data/validation/buildAthleteDiagnostics';
import {
  NormalizedCompetitionData,
  RawAdccFixture,
  RawAdccMatchRecord,
} from '@/domain/types';

const INITIALS_PATTERN = /^[A-Z]\.$/;

export interface CrossSexAthleteAnomaly {
  athleteId: string;
  athleteName: string;
  sexes: string[];
  weightClasses: string[];
  matchCount: number;
  firstMatchYear: number;
  lastMatchYear: number;
}

export interface SuspiciousAthleteActivityAnomaly {
  athleteId: string;
  athleteName: string;
  matchCount: number;
  firstMatchYear: number;
  lastMatchYear: number;
  editionSpan: number;
  reasons: string[];
}

export interface InitialsCollisionAnomaly {
  collisionKey: string;
  sex: string | null;
  surname: string;
  firstInitial: string;
  names: string[];
  years: number[];
  sourceAthleteIds: string[];
}

export interface SourceIdentityConflictAnomaly {
  sourceAthleteId: string;
  sexes: string[];
  names: string[];
  years: number[];
}

export interface MissingWorldEventAnomaly {
  year: number;
  expectedName: string;
  resultsUrl?: string;
}

export interface AdccIntegrityReport {
  generatedAt: string;
  source: RawAdccFixture['source'];
  summary: {
    athleteCount: number;
    matchCount: number;
    observedEventYears: number[];
    knownWorldEventYears: number[];
    missingKnownWorldEventYears: number[];
    crossSexAthleteCount: number;
    suspiciousActivityCount: number;
    initialsCollisionCount: number;
    sourceIdentityConflictCount: number;
  };
  anomalies: {
    crossSexAthletes: CrossSexAthleteAnomaly[];
    suspiciousAthleteActivity: SuspiciousAthleteActivityAnomaly[];
    initialsCollisions: InitialsCollisionAnomaly[];
    sourceIdentityConflicts: SourceIdentityConflictAnomaly[];
    missingWorldEvents: MissingWorldEventAnomaly[];
  };
}

interface AthleteObservation {
  sourceAthleteId: string | null;
  name: string;
  sex: string | null;
  weightClass: string | null;
  year: number;
}

export function buildAdccIntegrityReport(
  fixture: RawAdccFixture,
  normalized: NormalizedCompetitionData,
  options?: {
    highMatchCountThreshold?: number;
    longEditionSpanThreshold?: number;
  },
): AdccIntegrityReport {
  const highMatchCountThreshold = options?.highMatchCountThreshold ?? 20;
  const longEditionSpanThreshold = options?.longEditionSpanThreshold ?? 6;
  const eventYearsById = new Map(
    normalized.events.map((event) => [event.id, event.year] as const),
  );
  const observations = buildAthleteObservations(fixture.matches);
  const observedEventYears = [...new Set(normalized.events.map((event) => event.year))]
    .sort((left, right) => left - right);
  const missingWorldEvents = ADCC_WORLD_CHAMPIONSHIP_EVENT_REFERENCES.filter(
    (event) => !observedEventYears.includes(event.year),
  ).map((event) => ({
    year: event.year,
    expectedName: event.name,
    resultsUrl: event.resultsUrl,
  }));

  const athleteActivity = normalized.athletes
    .map((athlete) => {
      const matchYears = normalized.matches
        .filter(
          (match) =>
            match.winnerId === athlete.id || match.loserId === athlete.id,
        )
        .map((match) => eventYearsById.get(match.eventId))
        .filter((year): year is number => year !== undefined)
        .sort((left, right) => left - right);

      if (matchYears.length === 0) {
        return null;
      }

      const firstMatchYear = matchYears[0];
      const lastMatchYear = matchYears[matchYears.length - 1];

      return {
        athleteId: athlete.id,
        athleteName: athlete.name,
        sexes: [...athlete.sexes].sort(),
        weightClasses: [...athlete.weightClasses].sort(),
        matchCount: matchYears.length,
        firstMatchYear,
        lastMatchYear,
        editionSpan: Math.floor((lastMatchYear - firstMatchYear) / 2) + 1,
      };
    })
    .filter(
      (
        athlete,
      ): athlete is NonNullable<typeof athlete> => athlete !== null,
    );

  const crossSexAthletes = athleteActivity
    .filter((athlete) => athlete.sexes.length > 1)
    .map((athlete) => ({
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      sexes: athlete.sexes,
      weightClasses: athlete.weightClasses,
      matchCount: athlete.matchCount,
      firstMatchYear: athlete.firstMatchYear,
      lastMatchYear: athlete.lastMatchYear,
    }))
    .sort((left, right) => right.matchCount - left.matchCount);

  const suspiciousAthleteActivity = athleteActivity
    .map((athlete) => {
      const reasons: string[] = [];

      if (athlete.matchCount > highMatchCountThreshold) {
        reasons.push('high_match_count');
      }

      if (athlete.editionSpan > longEditionSpanThreshold) {
        reasons.push('overlong_edition_span');
      }

      return reasons.length > 0
        ? {
            athleteId: athlete.athleteId,
            athleteName: athlete.athleteName,
            matchCount: athlete.matchCount,
            firstMatchYear: athlete.firstMatchYear,
            lastMatchYear: athlete.lastMatchYear,
            editionSpan: athlete.editionSpan,
            reasons,
          }
        : null;
    })
    .filter(
      (
        athlete,
      ): athlete is SuspiciousAthleteActivityAnomaly => athlete !== null,
    )
    .sort((left, right) => right.matchCount - left.matchCount);

  const initialsCollisions = buildInitialsCollisionAnomalies(observations);
  const sourceIdentityConflicts = buildSourceIdentityConflictAnomalies(
    observations,
  );
  const diagnosticSummary = buildAthleteDiagnostics(normalized, 10);

  return {
    generatedAt: new Date().toISOString(),
    source: fixture.source,
    summary: {
      athleteCount: normalized.athletes.length,
      matchCount: normalized.matches.length,
      observedEventYears,
      knownWorldEventYears: ADCC_WORLD_CHAMPIONSHIP_EVENT_REFERENCES.map(
        (event) => event.year,
      ),
      missingKnownWorldEventYears: missingWorldEvents.map((event) => event.year),
      crossSexAthleteCount: crossSexAthletes.length,
      suspiciousActivityCount: suspiciousAthleteActivity.length,
      initialsCollisionCount: initialsCollisions.length,
      sourceIdentityConflictCount: sourceIdentityConflicts.length,
    },
    anomalies: {
      crossSexAthletes,
      suspiciousAthleteActivity: suspiciousAthleteActivity.concat(
        diagnosticSummary.suspiciousAthletes
          .filter(
            (entry) =>
              !suspiciousAthleteActivity.some(
                (candidate) => candidate.athleteId === entry.athleteId,
              ),
          )
          .map((entry) => ({
            athleteId: entry.athleteId,
            athleteName: entry.athleteName,
            matchCount: entry.matchCount,
            firstMatchYear: entry.firstMatchYear,
            lastMatchYear: entry.lastMatchYear,
            editionSpan: entry.editionSpan,
            reasons: entry.reasons,
          })),
      ),
      initialsCollisions,
      sourceIdentityConflicts,
      missingWorldEvents,
    },
  };
}

export function renderAdccIntegrityReportMarkdown(
  report: AdccIntegrityReport,
): string {
  const lines: string[] = [
    '# ADCC Integrity Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Source: ${report.source}`,
    '',
    '## Summary',
    '',
    `- Athletes: ${report.summary.athleteCount}`,
    `- Matches: ${report.summary.matchCount}`,
    `- Observed event years: ${report.summary.observedEventYears.join(', ')}`,
    `- Missing known ADCC world years: ${report.summary.missingKnownWorldEventYears.join(', ') || 'None'}`,
    `- Cross-sex athletes: ${report.summary.crossSexAthleteCount}`,
    `- Suspicious activity cases: ${report.summary.suspiciousActivityCount}`,
    `- Initials/name-collision groups: ${report.summary.initialsCollisionCount}`,
    `- Source-ID conflicts: ${report.summary.sourceIdentityConflictCount}`,
    '',
    '## Missing World Events',
    '',
  ];

  if (report.anomalies.missingWorldEvents.length === 0) {
    lines.push('- None');
  } else {
    report.anomalies.missingWorldEvents.forEach((event) => {
      lines.push(
        `- ${event.year}: ${event.expectedName}${event.resultsUrl ? ` (${event.resultsUrl})` : ''}`,
      );
    });
  }

  lines.push('', '## Cross-Sex Athletes', '');

  if (report.anomalies.crossSexAthletes.length === 0) {
    lines.push('- None');
  } else {
    report.anomalies.crossSexAthletes.slice(0, 20).forEach((athlete) => {
      lines.push(
        `- ${athlete.athleteName} [${athlete.athleteId}] — sexes: ${athlete.sexes.join(', ')}; matches: ${athlete.matchCount}; years: ${athlete.firstMatchYear}-${athlete.lastMatchYear}`,
      );
    });
  }

  lines.push('', '## Suspicious Activity', '');

  if (report.anomalies.suspiciousAthleteActivity.length === 0) {
    lines.push('- None');
  } else {
    report.anomalies.suspiciousAthleteActivity
      .slice(0, 20)
      .forEach((athlete) => {
        lines.push(
          `- ${athlete.athleteName} [${athlete.athleteId}] — matches: ${athlete.matchCount}; span: ${athlete.firstMatchYear}-${athlete.lastMatchYear}; reasons: ${athlete.reasons.join(', ')}`,
        );
      });
  }

  lines.push('', '## Initials / Name Collisions', '');

  if (report.anomalies.initialsCollisions.length === 0) {
    lines.push('- None');
  } else {
    report.anomalies.initialsCollisions.slice(0, 20).forEach((collision) => {
      lines.push(
        `- ${collision.collisionKey} — names: ${collision.names.join(' / ')}; years: ${collision.years.join(', ')}`,
      );
    });
  }

  lines.push('', '## Source-ID Conflicts', '');

  if (report.anomalies.sourceIdentityConflicts.length === 0) {
    lines.push('- None');
  } else {
    report.anomalies.sourceIdentityConflicts
      .slice(0, 20)
      .forEach((conflict) => {
        lines.push(
          `- source athlete ${conflict.sourceAthleteId} — names: ${conflict.names.join(' / ')}; sexes: ${conflict.sexes.join(', ')}; years: ${conflict.years.join(', ')}`,
        );
      });
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

function buildAthleteObservations(
  matches: RawAdccMatchRecord[],
): AthleteObservation[] {
  return matches.flatMap((match) => {
    const year = match.event.year;

    return [
      {
        sourceAthleteId: normalizeSourceAthleteId(match.winnerSourceId),
        name: match.winner.name,
        sex: match.sex ?? null,
        weightClass: match.weightClass ?? null,
        year,
      },
      {
        sourceAthleteId: normalizeSourceAthleteId(match.loserSourceId),
        name: match.loser.name,
        sex: match.sex ?? null,
        weightClass: match.weightClass ?? null,
        year,
      },
    ];
  });
}

function buildInitialsCollisionAnomalies(
  observations: AthleteObservation[],
): InitialsCollisionAnomaly[] {
  const grouped = observations.reduce((registry, observation) => {
    const collision = createInitialsCollisionKey(observation.name, observation.sex);

    if (!collision) {
      return registry;
    }

    const existing = registry.get(collision.collisionKey) ?? {
      collisionKey: collision.collisionKey,
      sex: observation.sex,
      surname: collision.surname,
      firstInitial: collision.firstInitial,
      names: new Set<string>(),
      years: new Set<number>(),
      sourceAthleteIds: new Set<string>(),
    };

    existing.names.add(observation.name);
    existing.years.add(observation.year);

    if (observation.sourceAthleteId) {
      existing.sourceAthleteIds.add(observation.sourceAthleteId);
    }

    registry.set(collision.collisionKey, existing);
    return registry;
  }, new Map<string, {
    collisionKey: string;
    sex: string | null;
    surname: string;
    firstInitial: string;
    names: Set<string>;
    years: Set<number>;
    sourceAthleteIds: Set<string>;
  }>());

  return [...grouped.values()]
    .filter((group) => {
      const names = [...group.names];

      return (
        names.length > 1 &&
        names.some((name) => hasInitialOnlyGivenName(name)) &&
        names.some((name) => !hasInitialOnlyGivenName(name))
      );
    })
    .map((group) => ({
      collisionKey: group.collisionKey,
      sex: group.sex,
      surname: group.surname,
      firstInitial: group.firstInitial,
      names: [...group.names].sort(),
      years: [...group.years].sort((left, right) => left - right),
      sourceAthleteIds: [...group.sourceAthleteIds].sort(),
    }))
    .sort((left, right) => left.collisionKey.localeCompare(right.collisionKey));
}

function buildSourceIdentityConflictAnomalies(
  observations: AthleteObservation[],
): SourceIdentityConflictAnomaly[] {
  const grouped = observations.reduce((registry, observation) => {
    if (!observation.sourceAthleteId) {
      return registry;
    }

    const existing = registry.get(observation.sourceAthleteId) ?? {
      sourceAthleteId: observation.sourceAthleteId,
      sexes: new Set<string>(),
      names: new Set<string>(),
      years: new Set<number>(),
    };

    if (observation.sex) {
      existing.sexes.add(observation.sex);
    }

    existing.names.add(observation.name);
    existing.years.add(observation.year);
    registry.set(observation.sourceAthleteId, existing);
    return registry;
  }, new Map<string, {
    sourceAthleteId: string;
    sexes: Set<string>;
    names: Set<string>;
    years: Set<number>;
  }>());

  return [...grouped.values()]
    .filter((group) => group.sexes.size > 1 || group.names.size > 1)
    .map((group) => ({
      sourceAthleteId: group.sourceAthleteId,
      sexes: [...group.sexes].sort(),
      names: [...group.names].sort(),
      years: [...group.years].sort((left, right) => left - right),
    }))
    .sort((left, right) =>
      left.sourceAthleteId.localeCompare(right.sourceAthleteId),
    );
}

function createInitialsCollisionKey(name: string, sex: string | null) {
  const parts = name
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const [givenName] = parts;
  const surname = parts[parts.length - 1].toLowerCase();
  const firstInitial = givenName[0]?.toLowerCase();

  if (!firstInitial) {
    return null;
  }

  return {
    collisionKey: `${sex ?? 'unknown'}:${surname}:${firstInitial}`,
    surname,
    firstInitial,
  };
}

function hasInitialOnlyGivenName(name: string) {
  const givenName = name.trim().split(/\s+/)[0] ?? '';
  return INITIALS_PATTERN.test(givenName);
}

function normalizeSourceAthleteId(sourceAthleteId?: string) {
  if (!sourceAthleteId || sourceAthleteId === '-1') {
    return null;
  }

  return sourceAthleteId;
}
