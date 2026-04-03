export type AthleteId = string;
export type MatchId = string;
export type EventId = string;

export interface Athlete {
  id: AthleteId;
  name: string;
  nationality?: string;
  team?: string;
  divisions: string[];
}

export interface Event {
  id: EventId;
  name: string;
  year: number;
  location?: string;
}

export interface Match {
  id: MatchId;
  eventId: EventId;
  division: string;
  winnerId: AthleteId;
  loserId: AthleteId;
  method?: string;
  roundLabel?: string;
}

export interface EraFilter {
  startYear: number;
  endYear: number;
}

export interface GraphNodeViewModel {
  id: AthleteId;
  label: string;
  size: number;
  position: {
    x: number;
    y: number;
  };
}

export interface GraphEdgeViewModel {
  id: string;
  source: AthleteId;
  target: AthleteId;
  weight: number;
  sourcePosition: {
    x: number;
    y: number;
  };
  targetPosition: {
    x: number;
    y: number;
  };
  angle: number;
  length: number;
}

export interface RawAdccAthleteRecord {
  name: string;
  nationality?: string;
  team?: string;
}

export interface RawAdccMatchRecord {
  event: {
    name: string;
    year: number;
    location?: string;
  };
  division: string;
  winner: RawAdccAthleteRecord;
  loser: RawAdccAthleteRecord;
  method?: string;
  round?: string;
}

export interface RawAdccFixture {
  source: 'fixture';
  label: string;
  notes: string;
  matches: RawAdccMatchRecord[];
}

export interface NormalizedCompetitionData {
  athletes: Athlete[];
  events: Event[];
  matches: Match[];
}
