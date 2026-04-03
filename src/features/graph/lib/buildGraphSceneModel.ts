import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import { GraphEdgeViewModel } from '@/domain/types';
import {
  GraphAthleteDetail,
  GraphFilters,
  GraphSceneModel,
} from '@/features/graph/lib/types';

const EDGE_BASE_COLOR = 'rgba(157, 219, 211, 0.22)';
const RIVALRY_EDGE_COLOR = 'rgba(80, 227, 194, 0.48)';

export function createDefaultGraphFilters(
  snapshot: UniverseSnapshot,
): GraphFilters {
  const division =
    snapshot.filters.divisions.length === 1
      ? snapshot.filters.divisions[0]
      : null;

  return {
    year: null,
    division,
    displayMode: 'all',
  };
}

export function buildGraphSceneModel(
  snapshot: UniverseSnapshot,
  filters: GraphFilters,
): GraphSceneModel {
  const filteredEdges = snapshot.edges.filter((edge) => {
    const matchesYear = filters.year === null || edge.year === filters.year;
    const matchesDivision =
      filters.division === null || edge.division === filters.division;

    return matchesYear && matchesDivision;
  });

  const activeNodeIds = new Set(
    filteredEdges.flatMap((edge) => [edge.source, edge.target]),
  );

  const activityCounts = filteredEdges.reduce((registry, edge) => {
    registry.set(edge.source, (registry.get(edge.source) ?? 0) + 1);
    registry.set(edge.target, (registry.get(edge.target) ?? 0) + 1);
    return registry;
  }, new Map<string, number>());

  const nodes = snapshot.nodes
    .filter((node) =>
      filteredEdges.length > 0
        ? activeNodeIds.has(node.id)
        : filters.year === null && filters.division === null,
    )
    .map((node) => ({
      ...node,
      activeMatches: activityCounts.get(node.id) ?? 0,
      size: node.size + Math.max(0, (activityCounts.get(node.id) ?? 0) - 1) * 2,
    }));

  const years = [...new Set(filteredEdges.map((edge) => edge.year))].sort(
    (left, right) => left - right,
  );
  const minYear = years[0] ?? snapshot.filters.years[0] ?? 0;
  const maxYear =
    years[years.length - 1] ??
    snapshot.filters.years[snapshot.filters.years.length - 1] ??
    minYear;

  const edges = filteredEdges.map((edge) => ({
    ...edge,
    color: resolveEdgeColor(edge, filters.displayMode, minYear, maxYear),
    size: resolveEdgeSize(edge, filters.displayMode),
  }));

  return {
    nodes,
    edges,
    years: snapshot.filters.years,
    divisions: snapshot.filters.divisions,
  };
}

export function getAthleteDetail(
  scene: GraphSceneModel,
  athleteId: string | null,
): GraphAthleteDetail | null {
  if (!athleteId) {
    return null;
  }

  const athlete = scene.nodes.find((node) => node.id === athleteId);

  if (!athlete) {
    return null;
  }

  const relatedMatches = scene.edges
    .filter((edge) => edge.source === athleteId || edge.target === athleteId)
    .map((edge) => {
      const opponentId = edge.source === athleteId ? edge.target : edge.source;
      const opponentLabel =
        scene.nodes.find((node) => node.id === opponentId)?.label ?? opponentId;

      return {
        ...edge,
        opponentLabel,
        resultLabel:
          edge.source === athleteId
            ? ('Won over' as const)
            : ('Lost to' as const),
      };
    })
    .sort((left, right) => right.year - left.year);

  return {
    athlete,
    relatedMatches,
  };
}

function resolveEdgeColor(
  edge: Pick<GraphEdgeViewModel, 'rivalryCount' | 'year'>,
  displayMode: GraphFilters['displayMode'],
  minYear: number,
  maxYear: number,
): string {
  if (displayMode === 'rivalry') {
    return edge.rivalryCount > 1 ? RIVALRY_EDGE_COLOR : EDGE_BASE_COLOR;
  }

  if (displayMode === 'era') {
    const range = Math.max(1, maxYear - minYear);
    const ratio = (edge.year - minYear) / range;
    const hue = 195 - ratio * 70;
    return `hsla(${hue}, 88%, 70%, 0.44)`;
  }

  return EDGE_BASE_COLOR;
}

function resolveEdgeSize(
  edge: Pick<GraphEdgeViewModel, 'rivalryCount' | 'year'>,
  displayMode: GraphFilters['displayMode'],
): number {
  if (displayMode === 'rivalry') {
    return 1.4 + (edge.rivalryCount - 1) * 1.2;
  }

  if (displayMode === 'era') {
    return 1.4 + Math.max(0, edge.year - 2018) * 0.14;
  }

  return 1.5;
}
