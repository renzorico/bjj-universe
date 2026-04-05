export interface SourceProvenance {
  source: string;
  sourceMatchId?: string;
  sourceAthleteId?: string;
  sourceEventName?: string;
  year?: number;
  field?: string;
}

export interface CleaningFlag {
  code:
    | 'missing_source_athlete_id'
    | 'source_id_multiple_names'
    | 'source_id_cross_sex'
    | 'name_based_identity'
    | 'cross_sex_candidate';
  severity: 'info' | 'warning' | 'error';
  message: string;
  athleteId?: string;
  matchId?: string;
  provenance: SourceProvenance[];
}

export interface CleanedAthleteRecord {
  canonicalAthleteId: string;
  displayName: string;
  aliases: string[];
  sexes: string[];
  weightClasses: string[];
  sourceAthleteIds: string[];
  provenance: SourceProvenance[];
  flags: CleaningFlag[];
}

export interface CleanedEventRecord {
  canonicalEventId: string;
  displayName: string;
  year: number;
  location?: string;
  provenance: SourceProvenance[];
}

export interface CleanedMatchRecord {
  canonicalMatchId: string;
  winnerAthleteId: string;
  loserAthleteId: string;
  eventId: string;
  sex: string | null;
  weightClass: string | null;
  method?: string;
  submission?: string;
  roundLabel?: string;
  provenance: SourceProvenance[];
  flags: CleaningFlag[];
}

export interface CleanedAdccDataset {
  generatedAt: string;
  source: string;
  athletes: CleanedAthleteRecord[];
  events: CleanedEventRecord[];
  matches: CleanedMatchRecord[];
  quarantine: CleaningFlag[];
}
