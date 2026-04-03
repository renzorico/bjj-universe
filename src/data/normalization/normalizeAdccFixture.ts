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
    const winnerId = registerAthlete(athletes, record.winner, record.division);
    const loserId = registerAthlete(athletes, record.loser, record.division);

    if (!events.has(eventId)) {
      events.set(eventId, {
        id: eventId,
        name: record.event.name,
        year: record.event.year,
        location: record.event.location,
      });
    }

    return {
      id: `match_${index + 1}`,
      eventId,
      division: record.division,
      winnerId,
      loserId,
      method: record.method,
      roundLabel: record.round,
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
  division: string,
): string {
  const athleteId = `athlete_${slugify(record.name)}`;
  const existing = registry.get(athleteId);

  if (existing) {
    if (!existing.divisions.includes(division)) {
      existing.divisions.push(division);
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
    divisions: [division],
  });

  return athleteId;
}
