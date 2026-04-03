import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
} from '@/features/graph/lib/buildGraphSceneModel';
import { buildSigmaGraph } from '@/features/graph/lib/buildSigmaGraph';

describe('buildGraphSceneModel', () => {
  it('filters the scene by year and division and builds sigma-ready data', () => {
    const snapshot = createUniverseSnapshot();
    const filters = createDefaultGraphFilters(snapshot);
    const scene = buildGraphSceneModel(snapshot, {
      ...filters,
      year: 2024,
      division: '-99kg',
      displayMode: 'rivalry',
    });

    expect(scene.nodes).toHaveLength(2);
    expect(scene.edges).toHaveLength(1);
    expect(scene.edges[0]).toMatchObject({
      year: 2024,
      division: '-99kg',
      rivalryCount: 2,
    });
    expect(scene.edges[0].size).toBeGreaterThan(2);

    const sigmaGraph = buildSigmaGraph(scene.nodes, scene.edges);

    expect(sigmaGraph.order).toBe(2);
    expect(sigmaGraph.size).toBe(1);
    expect(sigmaGraph.getNodeAttributes('athlete_craig-jones')).toMatchObject({
      label: 'Craig Jones',
      x: 0.12,
      y: 0.5,
    });
    expect(sigmaGraph.getEdgeAttributes('edge_6')).toMatchObject({
      hidden: false,
    });
  });
});
