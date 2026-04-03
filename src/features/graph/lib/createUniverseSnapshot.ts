import fixture from '@/data/fixtures/adcc-sample.fixture.json';
import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
import { RawAdccFixture } from '@/domain/types';

const normalized = normalizeAdccFixture(fixture as RawAdccFixture);
const metrics = buildAthleteMetrics(normalized);
const graph = buildGraphViewModel(normalized, metrics);

export type UniverseSnapshot = typeof graph & {
  summary: {
    athleteCount: number;
    matchCount: number;
    eventCount: number;
    topBridgeAthlete: string;
  };
  topRivalries: {
    id: string;
    label: string;
    matches: number;
  }[];
};

export function createUniverseSnapshot(): UniverseSnapshot {
  const topBridgeAthlete =
    [...metrics.athletes.values()].sort(
      (left, right) => right.bridgeScore - left.bridgeScore,
    )[0]?.athlete.name ?? 'Unknown';

  return {
    ...graph,
    summary: {
      athleteCount: normalized.athletes.length,
      matchCount: normalized.matches.length,
      eventCount: normalized.events.length,
      topBridgeAthlete,
    },
    topRivalries: metrics.topRivalries,
  };
}
