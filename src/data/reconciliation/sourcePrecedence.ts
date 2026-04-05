export type AdccSourceRole =
  | 'official_event_results'
  | 'historical_bootstrap'
  | 'athlete_metadata';

export interface AdccSourcePrecedenceRule {
  role: AdccSourceRole;
  rank: 1 | 2 | 3;
  trust: 'authoritative' | 'secondary' | 'metadata_only';
  usage: string;
}

export const ADCC_SOURCE_PRECEDENCE_RULES: AdccSourcePrecedenceRule[] = [
  {
    role: 'official_event_results',
    rank: 1,
    trust: 'authoritative',
    usage:
      'Official ADCC event results pages are the highest-trust source for event, division, placement, and result-row truth.',
  },
  {
    role: 'historical_bootstrap',
    rank: 2,
    trust: 'secondary',
    usage:
      'The Kaggle historical dataset is a secondary bootstrap source for historical rows and comparison, not the final authority when an official event page exists.',
  },
  {
    role: 'athlete_metadata',
    rank: 3,
    trust: 'metadata_only',
    usage:
      'Athlete enrichment sources may supply metadata such as nationality or academy, but they must not be used as match-truth or event-result sources.',
  },
];
