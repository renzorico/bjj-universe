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
      year: 2022,
      division: 'M 99KG',
      displayMode: 'rivalry',
    });

    expect(scene.nodes.length).toBeGreaterThan(0);
    expect(scene.edges.length).toBeGreaterThan(0);
    expect(scene.edges.every((edge) => edge.year === 2022)).toBe(true);
    expect(scene.edges.every((edge) => edge.division === 'M 99KG')).toBe(true);
    expect(scene.edges.some((edge) => edge.size > 1.4)).toBe(true);

    const sigmaGraph = buildSigmaGraph(scene.nodes, scene.edges);
    const firstEdge = scene.edges[0];

    expect(sigmaGraph.order).toBe(scene.nodes.length);
    expect(sigmaGraph.size).toBe(scene.edges.length);
    expect(sigmaGraph.getNodeAttributes('athlete_7507')).toMatchObject({
      label: 'Nicholas Meregali',
      x: 0.68,
      y: 0.2,
    });

    expect(firstEdge).toBeDefined();
    if (!firstEdge) {
      throw new Error('Expected at least one edge in the filtered scene.');
    }

    expect(sigmaGraph.getEdgeAttributes(firstEdge.id)).toMatchObject({
      hidden: false,
    });
  });
});
