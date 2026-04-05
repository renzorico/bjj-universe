import { getAllAthletes } from '@/data/adcc/loadAthletes';
import { getAllCanonicalMatches } from '@/data/adcc/loadCanonicalMatches';
import { buildCanonicalAthleteMetrics } from '@/data/metrics/buildCanonicalAthleteMetrics';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
const athletes = getAllAthletes();
const canonicalMatches = getAllCanonicalMatches();
const metrics = buildCanonicalAthleteMetrics(athletes, canonicalMatches);
const graph = buildGraphViewModel(athletes, canonicalMatches, metrics, athletes);

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
    submissionRate: number;
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
      athleteCount: athletes.length,
      matchCount: canonicalMatches.length,
      eventCount: new Set(canonicalMatches.map((match) => match.eventId)).size,
      topBridgeAthlete,
      submissionRate: computeSubmissionRate(canonicalMatches),
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

function computeSubmissionRate(matches: ReturnType<typeof getAllCanonicalMatches>): number {
  const withMethod = matches.filter((match) => match.method != null);
  if (withMethod.length === 0) return 0;
  const submissions = withMethod.filter((match) => match.method === 'SUBMISSION').length;
  return Math.round((submissions / withMethod.length) * 100);
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
