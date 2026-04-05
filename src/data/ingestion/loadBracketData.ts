import { RawAdccMatchRecord } from '@/domain/types';

export interface BracketMatch {
  division: string;
  sex: string;
  weightClass: string;
  round: string;
  winner: string;
  loser: string;
  method: string;
  methodDetail?: string;
}

export interface BracketData {
  source: string;
  sourceUrl: string;
  event: {
    name: string;
    year: number;
    date: string;
    location: string;
  };
  matches: BracketMatch[];
}

export function bracketDataToFixtureMatches(
  data: BracketData,
): RawAdccMatchRecord[] {
  return data.matches.map((match) => {
    const sourceMatchId = [
      'bracket',
      data.event.year,
      match.weightClass,
      match.round,
      match.winner,
      match.loser,
    ]
      .join(':')
      .toLowerCase()
      .replace(/\s+/g, '-');

    return {
      sourceMatchId,
      recordType: 'bracket_match' as const,
      event: {
        name: data.event.name,
        year: data.event.year,
        location: data.event.location,
      },
      sex: match.sex,
      weightClass: match.weightClass,
      winner: { name: match.winner },
      loser: { name: match.loser },
      method: match.method,
      submission: isSubmission(match.method) ? match.method : undefined,
      round: match.round,
    };
  });
}

const SUBMISSION_METHODS = new Set([
  'Armbar',
  'RNC',
  'Kneebar',
  'Guillotine',
  'Katagatame',
  'Straight ankle lock',
  'Outside heel hook',
  'Darce choke',
  'Mir lock',
  'Junny lock',
  'Arm-in RNC',
]);

function isSubmission(method: string): boolean {
  return SUBMISSION_METHODS.has(method);
}
