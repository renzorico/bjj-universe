import {
  SceneEdgeViewModel,
  SceneNodeViewModel,
} from '@/features/graph/lib/types';

export interface ForceGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  wins: number;
  bridgeScore: number;
  activeMatches: number;
  clusterKey: string;
  clusterIndex: number;
  importance: number;
  eraAnchor: number;
}

export interface ForceGraphLink {
  id: string;
  source: string;
  target: string;
  color: string;
  width: number;
  rivalryCount: number;
  year: number;
  division: string;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

export function buildForceGraphData(
  nodes: SceneNodeViewModel[],
  edges: SceneEdgeViewModel[],
): ForceGraphData {
  const clusterPalette = buildClusterPalette(nodes);
  const yearBounds = resolveYearBounds(nodes);

  return {
    nodes: nodes.map((node) => {
      const clusterKey = resolveClusterKey(node);
      const clusterIndex =
        clusterPalette.clusterIndexByKey.get(clusterKey) ?? 0;
      const seededOffset = createSeededOffset(node.id);
      const eraAnchor = resolveEraAnchor(node.yearsActive, yearBounds);
      const x =
        scalePosition(node.position.x, 50, 10) +
        clusterPalette.clusterCenters[clusterIndex].x +
        seededOffset.x;
      const y =
        scalePosition(node.position.y, 50, 8) +
        clusterPalette.clusterCenters[clusterIndex].y +
        seededOffset.y;
      const z = eraAnchor + seededOffset.z;
      const importance =
        node.activeMatches + node.bridgeScore * 0.12 + node.wins * 1.5;

      return {
        id: node.id,
        label: node.label,
        x,
        y,
        z,
        size: clamp(3 + Math.sqrt(Math.max(1, importance)) * 1.15, 3.5, 13),
        color: clusterPalette.colorByKey.get(clusterKey) ?? '#7aa2ff',
        wins: node.wins,
        bridgeScore: node.bridgeScore,
        activeMatches: node.activeMatches,
        clusterKey,
        clusterIndex,
        importance,
        eraAnchor,
      };
    }),
    links: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      color: edge.color,
      width: clamp(edge.size, 1, 5),
      rivalryCount: edge.rivalryCount,
      year: edge.year,
      division: edge.division,
    })),
  };
}

interface ClusterPalette {
  colorByKey: Map<string, string>;
  clusterIndexByKey: Map<string, number>;
  clusterCenters: Array<{ x: number; y: number }>;
}

function scalePosition(value: number, origin: number, multiplier: number) {
  return Number(((value - origin) * multiplier).toFixed(3));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildClusterPalette(nodes: SceneNodeViewModel[]): ClusterPalette {
  const clusterKeys = [...new Set(nodes.map(resolveClusterKey))].sort();
  const palette = [
    '#86b7ff',
    '#5fe1c5',
    '#ffd977',
    '#ff8ac6',
    '#c6a6ff',
    '#ff9f7c',
    '#8de46b',
    '#70c8ff',
  ];
  const clusterIndexByKey = new Map(
    clusterKeys.map((key, index) => [key, index] as const),
  );
  const colorByKey = new Map(
    clusterKeys.map(
      (key, index) => [key, palette[index % palette.length]] as const,
    ),
  );

  if (clusterKeys.length === 0) {
    return {
      colorByKey,
      clusterIndexByKey,
      clusterCenters: [{ x: 0, y: 0 }],
    };
  }

  const clusterCenters = clusterKeys.map((_, index) => {
    if (clusterKeys.length === 1) {
      return { x: 0, y: 0 };
    }

    const angle = (index / clusterKeys.length) * Math.PI * 2;
    return {
      x: Number((Math.cos(angle) * 110).toFixed(3)),
      y: Number((Math.sin(angle) * 90).toFixed(3)),
    };
  });

  return {
    colorByKey,
    clusterIndexByKey,
    clusterCenters,
  };
}

function resolveClusterKey(node: SceneNodeViewModel) {
  return node.divisions[0] ?? 'Open';
}

function resolveYearBounds(nodes: SceneNodeViewModel[]) {
  const years = nodes.flatMap((node) => node.yearsActive);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
    return { minYear: 2000, maxYear: 2024 };
  }

  return { minYear, maxYear };
}

function resolveEraAnchor(
  yearsActive: number[],
  bounds: { minYear: number; maxYear: number },
) {
  if (yearsActive.length === 0) {
    return 0;
  }

  const averageYear =
    yearsActive.reduce((sum, year) => sum + year, 0) / yearsActive.length;
  const range = Math.max(1, bounds.maxYear - bounds.minYear);
  const ratio = (averageYear - bounds.minYear) / range;

  return Number(((ratio - 0.5) * 220).toFixed(3));
}

function createSeededOffset(seed: string) {
  const hash = seed.split('').reduce((value, character) => {
    return (value * 31 + character.charCodeAt(0)) % 104729;
  }, 17);
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 8 + (hash % 23);
  const zSign = hash % 2 === 0 ? 1 : -1;
  const zMagnitude = 6 + (hash % 29);

  return {
    x: Number((Math.cos(angle) * radius).toFixed(3)),
    y: Number((Math.sin(angle) * radius).toFixed(3)),
    z: Number((zSign * zMagnitude).toFixed(3)),
  };
}
