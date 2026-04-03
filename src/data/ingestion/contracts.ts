import { RawAdccFixture } from '@/domain/types';

export interface CompetitionIngestionSource<TInput, TOutput> {
  sourceName: string;
  validate(input: TInput): boolean;
  normalize(input: TInput): TOutput;
}

export type AdccFixtureIngestionSource = CompetitionIngestionSource<
  RawAdccFixture,
  RawAdccFixture
>;
