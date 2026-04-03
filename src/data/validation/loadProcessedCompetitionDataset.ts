import processedDataset from '@/data/processed/adcc-historical.processed.json';
import { ProcessedCompetitionDataset } from '@/domain/types';

export function loadProcessedCompetitionDataset(): ProcessedCompetitionDataset {
  return processedDataset as ProcessedCompetitionDataset;
}
