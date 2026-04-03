import { NormalizedCompetitionData } from '@/domain/types';

export interface AthleteDiagnosticEntry {
  athleteId: string;
  athleteName: string;
  matchCount: number;
  firstMatchYear: number;
  lastMatchYear: number;
  editionSpan: number;
  sexes: string[];
  weightClasses: string[];
}

export interface AthleteSpanWarning extends AthleteDiagnosticEntry {
  reasons: string[];
}

export interface AthleteDiagnosticsSummary {
  topAthletesByMatchCount: AthleteDiagnosticEntry[];
  outOfBoundsCount: number;
  overlongSpanCount: number;
  suspiciousAthletes: AthleteSpanWarning[];
}

export function buildAthleteDiagnostics(
  normalized: NormalizedCompetitionData,
  topN = 10,
): AthleteDiagnosticsSummary {
  const eventYears = new Map(
    normalized.events.map((event) => [event.id, event.year] as const),
  );

  const entries = normalized.athletes
    .map((athlete) => {
      const matchYears = normalized.matches
        .filter(
          (match) =>
            match.winnerId === athlete.id || match.loserId === athlete.id,
        )
        .map((match) => eventYears.get(match.eventId))
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
        matchCount: matchYears.length,
        firstMatchYear,
        lastMatchYear,
        editionSpan: Math.floor((lastMatchYear - firstMatchYear) / 2) + 1,
        sexes: [...athlete.sexes].sort(),
        weightClasses: [...athlete.weightClasses].sort(),
      };
    })
    .filter((entry): entry is AthleteDiagnosticEntry => entry !== null)
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return left.athleteName.localeCompare(right.athleteName);
    });

  const suspiciousAthletes = entries
    .map((entry) => {
      const reasons: string[] = [];

      if (entry.firstMatchYear < 1998 || entry.lastMatchYear > 2022) {
        reasons.push('out_of_bounds_year');
      }

      if (entry.editionSpan > 5) {
        reasons.push('overlong_edition_span');
      }

      return reasons.length > 0
        ? {
            ...entry,
            reasons,
          }
        : null;
    })
    .filter((entry): entry is AthleteSpanWarning => entry !== null);

  return {
    topAthletesByMatchCount: entries.slice(0, topN),
    outOfBoundsCount: suspiciousAthletes.filter((entry) =>
      entry.reasons.includes('out_of_bounds_year'),
    ).length,
    overlongSpanCount: suspiciousAthletes.filter((entry) =>
      entry.reasons.includes('overlong_edition_span'),
    ).length,
    suspiciousAthletes,
  };
}
