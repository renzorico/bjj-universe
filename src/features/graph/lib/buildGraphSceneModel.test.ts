import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
} from '@/features/graph/lib/buildGraphSceneModel';
import { buildForceGraphData } from '@/features/graph/lib/buildForceGraphData';

describe('buildGraphSceneModel', () => {
  it('filters the scene by year, sex, and weight class and builds graph-ready data', () => {
    const snapshot = createUniverseSnapshot();
    const filters = createDefaultGraphFilters();
    const scene = buildGraphSceneModel(snapshot, {
      ...filters,
      year: 2022,
      sex: 'M',
      weightClass: '99KG',
      displayMode: 'rivalry',
    });

    expect(scene.nodes.length).toBeGreaterThan(0);
    expect(scene.edges.length).toBeGreaterThan(0);
    expect(scene.edges.every((edge) => edge.year === 2022)).toBe(true);
    expect(scene.edges.every((edge) => edge.sex === 'M')).toBe(true);
    expect(scene.edges.every((edge) => edge.weightClass === '99KG')).toBe(true);
    expect(scene.edges.some((edge) => edge.size > 1.4)).toBe(true);

    const graphData = buildForceGraphData(scene.nodes, scene.edges, 'rivalry');
    const sceneNode = scene.nodes.find(
      (node) => node.id === 'athlete_nicholas-meregali-m',
    );
    const nodeAttributes = graphData.nodes.find(
      (node) => node.id === 'athlete_nicholas-meregali-m',
    );
    const uniquePositions = new Set(
      scene.nodes.map(
        (node) => `${node.position.x.toFixed(2)}:${node.position.y.toFixed(2)}`,
      ),
    );

    expect(graphData.nodes).toHaveLength(scene.nodes.length);
    expect(graphData.links).toHaveLength(scene.edges.length);
    expect(nodeAttributes?.label).toBe('Nicholas Meregali');
    expect(sceneNode?.nationality).toBe('Brazil');
    expect(sceneNode?.team).toBe('New Wave Jiu Jitsu');
    expect(nodeAttributes?.clusterKey).toBeDefined();
    expect(nodeAttributes?.importance).toBeGreaterThan(0);
    expect(typeof nodeAttributes?.anchorX).toBe('number');
    expect(typeof nodeAttributes?.anchorY).toBe('number');
    expect(typeof nodeAttributes?.anchorZ).toBe('number');
    expect(uniquePositions.size).toBeGreaterThanOrEqual(4);
  });

  it('builds the default scene from canonical athletes and removes the stale Yuji node', () => {
    const snapshot = createUniverseSnapshot();
    const scene = buildGraphSceneModel(snapshot, createDefaultGraphFilters());
    const tYano = scene.nodes.find((node) => node.id === 'athlete_t-yano-m');

    expect(scene.nodes).toHaveLength(334);
    expect(scene.nodes.find((node) => node.label === 'Yuji Arai')).toBeUndefined();
    expect(tYano?.displayTotalMatches).toBe(3);
    expect(tYano?.displaySex).toBe('M');
    expect(tYano?.displayPrimaryWeightClass).toBe('66KG');
  });
});
