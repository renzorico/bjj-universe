import {
  GraphDisplayMode,
  SceneEdgeViewModel,
  SceneNodeViewModel,
} from '@/features/graph/lib/types';

export interface ForceGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  size: number;
  color: string;
  wins: number;
  bridgeScore: number;
  activeMatches: number;
  clusterKey: string;
  clusterIndex: number;
  importance: number;
  eraAnchor: number;
  anchorX: number;
  anchorY: number;
  anchorZ: number;
  sexGroup: string;
  weightBand: string;
  eraValue: number;
  rivalryMatches: number;
}

export interface ForceGraphLink {
  id: string;
  source: string;
  target: string;
  color: string;
  width: number;
  rivalryCount: number;
  year: number;
  sex?: string;
  weightClass?: string;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  meta: {
    initialCamera: {
      position: { x: number; y: number; z: number };
      lookAt: { x: number; y: number; z: number };
    };
    mode: GraphDisplayMode;
    labelNodeIds: string[];
  };
}

export function buildForceGraphData(
  nodes: SceneNodeViewModel[],
  edges: SceneEdgeViewModel[],
  displayMode: GraphDisplayMode,
): ForceGraphData {
  const clusterPalette = buildClusterPalette(nodes);
  const yearBounds = resolveYearBounds(nodes);
  const weightBands = buildWeightBandRegistry(nodes);
  const rivalryCounts = buildRivalryRegistry(edges);
  const sexOffsets = resolveSexOffsets(nodes);

  return {
    nodes: nodes.map((node) => {
      const clusterKey = resolveClusterKey(node);
      const clusterIndex =
        clusterPalette.clusterIndexByKey.get(clusterKey) ?? 0;
      const seededOffset = createSeededOffset(node.id);
      const eraAnchor = resolveEraAnchor(node.yearsActive, yearBounds);
      const sexGroup = node.sexes[0] ?? 'Open';
      const weightBand = node.weightClasses[0] ?? 'Open';
      const sexOffset = sexOffsets.get(sexGroup) ?? 0;
      const weightOffset = weightBands.positionByKey.get(weightBand) ?? 0;
      const rivalryMatches = rivalryCounts.get(node.id) ?? 0;
      const anchorX = sexOffset + clusterPalette.clusterCenters[clusterIndex].x;
      const anchorY =
        weightOffset + clusterPalette.clusterCenters[clusterIndex].y * 0.25;
      const anchorZ = eraAnchor;
      const x =
        scalePosition(node.position.x, 50, 2.75) + anchorX + seededOffset.x;
      const y =
        scalePosition(node.position.y, 50, 2.2) + anchorY + seededOffset.y;
      const z = anchorZ + seededOffset.z;
      const importance =
        node.activeMatches + node.bridgeScore * 0.12 + node.wins * 1.5;

      return {
        id: node.id,
        label: node.label,
        x,
        y,
        z,
        fx: x,
        fy: y,
        fz: z,
        size: clamp(3.4 + Math.sqrt(Math.max(1, importance)) * 1.18, 3.8, 14),
        color: clusterPalette.colorByKey.get(clusterKey) ?? '#7aa2ff',
        wins: node.wins,
        bridgeScore: node.bridgeScore,
        activeMatches: node.activeMatches,
        clusterKey,
        clusterIndex,
        importance,
        eraAnchor,
        anchorX,
        anchorY,
        anchorZ,
        sexGroup,
        weightBand,
        eraValue:
          node.yearsActive.length > 0
            ? Number(
                (
                  node.yearsActive.reduce((sum, year) => sum + year, 0) /
                  node.yearsActive.length
                ).toFixed(2),
              )
            : yearBounds.minYear,
        rivalryMatches,
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
      sex: edge.sex,
      weightClass: edge.weightClass,
    })),
    meta: {
      initialCamera: {
        position: { x: 0, y: 0, z: 700 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
      mode: displayMode,
      labelNodeIds: nodes
        .slice()
        .sort((left, right) => right.activeMatches - left.activeMatches)
        .slice(0, 9)
        .map((node) => node.id),
    },
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
    '#e9e1d5',
    '#b8ab9b',
    '#8f8378',
    '#c24a43',
    '#7d2f2d',
    '#a78663',
    '#6f6760',
    '#d3c6b8',
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
      x: Number((Math.cos(angle) * 86).toFixed(3)),
      y: Number((Math.sin(angle) * 60).toFixed(3)),
    };
  });

  return {
    colorByKey,
    clusterIndexByKey,
    clusterCenters,
  };
}

function resolveClusterKey(node: SceneNodeViewModel) {
  const sex = node.sexes[0] ?? 'Open';
  const weightClass = node.weightClasses[0] ?? 'Open';
  return `${sex}:${weightClass}`;
}

function buildWeightBandRegistry(nodes: SceneNodeViewModel[]) {
  const uniqueWeights = [
    ...new Set(nodes.map((node) => node.weightClasses[0] ?? 'Open')),
  ].sort((left, right) => resolveWeightValue(left) - resolveWeightValue(right));
  const midpoint = (uniqueWeights.length - 1) / 2;
  const positionByKey = new Map(
    uniqueWeights.map((weightClass, index) => [
      weightClass,
      Number(((index - midpoint) * 68).toFixed(3)),
    ]),
  );

  return { positionByKey };
}

function resolveWeightValue(weightClass: string) {
  const match = weightClass.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function resolveSexOffsets(nodes: SceneNodeViewModel[]) {
  const sexes = [
    ...new Set(nodes.map((node) => node.sexes[0] ?? 'Open')),
  ].sort();
  const registry = new Map<string, number>();

  for (const sex of sexes) {
    if (sex === 'M') {
      registry.set(sex, -270);
      continue;
    }

    if (sex === 'F') {
      registry.set(sex, 270);
      continue;
    }

    registry.set(sex, 0);
  }

  return registry;
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

  return Number(((ratio - 0.5) * 500).toFixed(3));
}

function buildRivalryRegistry(edges: SceneEdgeViewModel[]) {
  const registry = new Map<string, number>();

  for (const edge of edges) {
    if (edge.rivalryCount <= 1) {
      continue;
    }

    registry.set(
      edge.source,
      (registry.get(edge.source) ?? 0) + edge.rivalryCount,
    );
    registry.set(
      edge.target,
      (registry.get(edge.target) ?? 0) + edge.rivalryCount,
    );
  }

  return registry;
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
