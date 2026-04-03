import {
  Athlete,
  Event,
  Match,
  NormalizedCompetitionData,
  RawAdccFixture,
} from '@/domain/types';
import { slugify } from '@/lib/slugify';

export function normalizeAdccFixture(
  fixture: RawAdccFixture,
): NormalizedCompetitionData {
  const athletes = new Map<string, Athlete>();
  const events = new Map<string, Event>();
  const matches: Match[] = fixture.matches.map((record, index) => {
    const eventId = `event_${slugify(`${record.event.name}-${record.event.year}`)}`;
    const winnerId = registerAthlete(
      athletes,
      record.winner,
      record.sex,
      record.weightClass,
      record.winnerSourceId,
    );
    const loserId = registerAthlete(
      athletes,
      record.loser,
      record.sex,
      record.weightClass,
      record.loserSourceId,
    );

    if (!events.has(eventId)) {
      events.set(eventId, {
        id: eventId,
        name: record.event.name,
        year: record.event.year,
        location: record.event.location,
      });
    }

    return {
      id: record.sourceMatchId
        ? `match_${record.sourceMatchId}`
        : `match_${index + 1}`,
      eventId,
      winnerId,
      loserId,
      sex: record.sex,
      weightClass: record.weightClass,
      method: record.method,
      submission: record.submission,
      roundLabel: record.round,
      winnerPoints: record.winnerPoints,
      loserPoints: record.loserPoints,
      advantagePenalty: record.advantagePenalty,
      sourceMatchId: record.sourceMatchId,
    };
  });

  return {
    athletes: [...athletes.values()],
    events: [...events.values()],
    matches,
  };
}

function registerAthlete(
  registry: Map<string, Athlete>,
  record: { name: string; nationality?: string; team?: string },
  sex?: string,
  weightClass?: string,
  sourceId?: string,
): string {
  const athleteId = resolveAthleteId(record.name, sex, sourceId);
  const existing = registry.get(athleteId);

  if (existing) {
    if (sex && !existing.sexes.includes(sex)) {
      existing.sexes.push(sex);
    }
    if (weightClass && !existing.weightClasses.includes(weightClass)) {
      existing.weightClasses.push(weightClass);
    }
    if (!existing.team && record.team) {
      existing.team = record.team;
    }
    if (!existing.nationality && record.nationality) {
      existing.nationality = record.nationality;
    }
    return athleteId;
  }

  registry.set(athleteId, {
    id: athleteId,
    name: record.name,
    nationality: record.nationality,
    team: record.team,
    sexes: sex ? [sex] : [],
    weightClasses: weightClass ? [weightClass] : [],
  });

  return athleteId;
}

function resolveAthleteId(name: string, sex?: string, sourceId?: string) {
  // The Kaggle dataset uses "-1" as a missing-athlete sentinel. Treating it as
  // a real source ID collapses many unrelated athletes into one impossible
  // aggregate profile, so we fall back to a name-based canonical ID instead.
  if (sourceId && sourceId !== '-1') {
    return `athlete_${sourceId}`;
  }

  const suffix = sex ? `-${sex}` : '';
  return `athlete_${slugify(`${name}${suffix}`)}`;
}
