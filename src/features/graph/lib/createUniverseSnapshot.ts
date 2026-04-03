import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
import fixture from '@/data/fixtures/adcc-sample.fixture.json';
import { loadProcessedCompetitionDataset } from '@/data/validation/loadProcessedCompetitionDataset';
import { RawAdccFixture } from '@/domain/types';

const processedDataset = loadProcessedCompetitionDataset();
const normalized =
  processedDataset.normalized.matches.length > 0
    ? processedDataset.normalized
    : normalizeAdccFixture(fixture as RawAdccFixture);
const metrics = buildAthleteMetrics(normalized);
const graph = buildGraphViewModel(normalized, metrics);

export type UniverseSnapshot = typeof graph & {
  filters: {
    years: number[];
    sexes: string[];
    weightClasses: string[];
    weightClassesBySex: Record<string, string[]>;
  };
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
    filters: {
      years: [...new Set(graph.edges.map((edge) => edge.year))].sort(
        (left, right) => left - right,
      ),
      sexes: [
        ...new Set(graph.edges.map((edge) => edge.sex).filter(Boolean)),
      ].sort() as string[],
      weightClasses: [
        ...new Set(graph.edges.map((edge) => edge.weightClass).filter(Boolean)),
      ].sort() as string[],
      weightClassesBySex: buildWeightClassesBySex(graph.edges),
    },
    topRivalries: metrics.topRivalries,
  };
}

function buildWeightClassesBySex(
  edges: Array<{ sex?: string; weightClass?: string }>,
) {
  const registry = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!edge.sex || !edge.weightClass) {
      continue;
    }

    if (!registry.has(edge.sex)) {
      registry.set(edge.sex, new Set());
    }

    registry.get(edge.sex)?.add(edge.weightClass);
  }

  return Object.fromEntries(
    [...registry.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([sex, weightClasses]) => [sex, [...weightClasses].sort()]),
  );
}
