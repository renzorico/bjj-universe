export type AthleteId = string;
export type MatchId = string;
export type EventId = string;

export interface Athlete {
  id: AthleteId;
  name: string;
  nationality?: string;
  team?: string;
  sexes: string[];
  weightClasses: string[];
}

export interface AdccAthlete {
  canonicalAthleteId: string;
  name: string;
  sex: string;
  primaryWeightClass: string;
  activeYearFirst: number;
  activeYearLast: number;
  totalMatches: number;
  nationality: string | null;
  team: string | null;
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
  winnerId: AthleteId;
  loserId: AthleteId;
  recordType?: 'observed_match' | 'official_result_relation';
  sex?: string;
  weightClass?: string;
  method?: string;
  submission?: string;
  roundLabel?: string;
  winnerPoints?: number;
  loserPoints?: number;
  advantagePenalty?: string;
  sourceMatchId?: string;
}

export interface CanonicalAdccMatch {
  id: MatchId;
  sourceMatchId: string;
  eventId: EventId;
  eventName: string;
  year: number;
  winnerCanonicalId: AthleteId;
  loserCanonicalId: AthleteId;
  sex?: string;
  weightClass?: string;
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
  displaySex: string | null;
  displayPrimaryWeightClass: string | null;
  displayActiveYearFirst: number | null;
  displayActiveYearLast: number | null;
  displayTotalMatches: number | null;
  size: number;
  wins: number;
  losses: number;
  yearsActive: number[];
  sexes: string[];
  weightClasses: string[];
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
  sex?: string;
  weightClass?: string;
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
  recordType?: 'observed_match' | 'official_result_relation';
  sex?: string;
  weightClass?: string;
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
    athleteSpanWarnings: {
      outOfBoundsCount: number;
      overlongSpanCount: number;
      suspiciousAthletes: Array<{
        athleteId: string;
        athleteName: string;
        matchCount: number;
        firstMatchYear: number;
        lastMatchYear: number;
        editionSpan: number;
        reasons: string[];
      }>;
    };
  };
  normalized: NormalizedCompetitionData;
}
