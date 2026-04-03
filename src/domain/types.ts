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
  sex?: string;
  method?: string;
  submission?: string;
  roundLabel?: string;
  winnerPoints?: number;
  loserPoints?: number;
  advantagePenalty?: string;
  sourceMatchId?: string;
}

export interface EraFilter {
  startYear: number;
  endYear: number;
}

export interface GraphNodeViewModel {
  id: AthleteId;
  label: string;
  size: number;
  wins: number;
  losses: number;
  yearsActive: number[];
  divisions: string[];
  nationality?: string;
  team?: string;
  bridgeScore: number;
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
  eventId: EventId;
  eventName: string;
  year: number;
  division: string;
  method?: string;
  roundLabel?: string;
  rivalryId: string;
  rivalryCount: number;
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
  sourceMatchId?: string;
  event: {
    name: string;
    year: number;
    location?: string;
    inferredName?: boolean;
  };
  division: string;
  sex?: string;
  winner: RawAdccAthleteRecord;
  loser: RawAdccAthleteRecord;
  winnerSourceId?: string;
  loserSourceId?: string;
  method?: string;
  submission?: string;
  round?: string;
  winnerPoints?: number;
  loserPoints?: number;
  advantagePenalty?: string;
}

export interface RawAdccFixture {
  source: 'fixture' | 'adcc-historical-kaggle';
  label: string;
  notes: string;
  matches: RawAdccMatchRecord[];
}

export interface NormalizedCompetitionData {
  athletes: Athlete[];
  events: Event[];
  matches: Match[];
}

export interface ProcessedCompetitionDataset {
  source: RawAdccFixture['source'];
  label: string;
  notes: string;
  schema: {
    detectedColumns: string[];
    requiredColumns: string[];
    optionalColumns: string[];
  };
  validationSummary: {
    totalRows: number;
    acceptedRows: number;
    quarantinedRows: number;
    quarantineReasons: Record<string, number>;
  };
  normalized: NormalizedCompetitionData;
}
