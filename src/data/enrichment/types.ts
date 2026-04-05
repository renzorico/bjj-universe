export interface AthleteEnrichmentTarget {
  athleteId: string;
  athleteName: string;
  matchCount: number;
}

export interface AthleteMetadataField {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  provenance: {
    sourceName: string;
    sourceUrl: string;
    extractedAt: string;
  };
}

export interface AthleteMetadataSourceManifestEntry {
  athleteId: string;
  athleteName: string;
  sourceName: 'bjjheroes';
  sourceUrl: string;
}

export interface AthleteMetadataEnrichmentRecord {
  athleteId: string;
  athleteName: string;
  sourceName: string;
  sourceUrl: string;
  status: 'enriched' | 'blocked' | 'missing_fields';
  notes?: string[];
  nationality?: AthleteMetadataField;
  academy?: AthleteMetadataField;
}
