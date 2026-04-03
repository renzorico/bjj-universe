import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
} from '@/features/graph/lib/buildGraphSceneModel';
import { buildForceGraphData } from '@/features/graph/lib/buildForceGraphData';

describe('buildGraphSceneModel', () => {
  it('filters the scene by year and division and builds graph-ready data', () => {
    const snapshot = createUniverseSnapshot();
    const filters = createDefaultGraphFilters(snapshot);
    const scene = buildGraphSceneModel(snapshot, {
      ...filters,
      year: 2022,
      division: 'M 99KG',
      displayMode: 'rivalry',
    });

    expect(scene.nodes.length).toBeGreaterThan(0);
    expect(scene.edges.length).toBeGreaterThan(0);
    expect(scene.edges.every((edge) => edge.year === 2022)).toBe(true);
    expect(scene.edges.every((edge) => edge.division === 'M 99KG')).toBe(true);
    expect(scene.edges.some((edge) => edge.size > 1.4)).toBe(true);

    const graphData = buildForceGraphData(scene.nodes, scene.edges);
    const nodeAttributes = graphData.nodes.find(
      (node) => node.id === 'athlete_7507',
    );
    const uniquePositions = new Set(
      scene.nodes.map(
        (node) => `${node.position.x.toFixed(2)}:${node.position.y.toFixed(2)}`,
      ),
    );

    expect(graphData.nodes).toHaveLength(scene.nodes.length);
    expect(graphData.links).toHaveLength(scene.edges.length);
    expect(nodeAttributes?.label).toBe('Nicholas Meregali');
    expect(nodeAttributes?.fx).toBeDefined();
    expect(nodeAttributes?.fy).toBeDefined();
    expect(uniquePositions.size).toBeGreaterThan(6);
  });
});
