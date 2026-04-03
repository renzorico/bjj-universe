import { buildForceGraphData } from '@/features/graph/lib/buildForceGraphData';
import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
} from '@/features/graph/lib/buildGraphSceneModel';

describe('buildForceGraphData', () => {
  it('converts filtered scene data into stable, more separated positioned nodes and links', () => {
    const snapshot = createUniverseSnapshot();
    const filters = createDefaultGraphFilters();
    const scene = buildGraphSceneModel(snapshot, {
      ...filters,
      year: 2022,
      sex: 'M',
      weightClass: '99KG',
      displayMode: 'all',
    });

    const graphData = buildForceGraphData(scene.nodes, scene.edges, 'all');
    const athlete = graphData.nodes.find((node) => node.id === 'athlete_7507');

    expect(graphData.nodes.length).toBe(scene.nodes.length);
    expect(graphData.links.length).toBe(scene.edges.length);
    expect(athlete).toMatchObject({
      id: 'athlete_7507',
      label: 'Nicholas Meregali',
    });
    expect(athlete?.x).toBeGreaterThanOrEqual(-560);
    expect(athlete?.x).toBeLessThanOrEqual(560);
    expect(athlete?.y).toBeGreaterThanOrEqual(-420);
    expect(athlete?.y).toBeLessThanOrEqual(420);
    expect(athlete?.z).toBeGreaterThanOrEqual(-300);
    expect(athlete?.z).toBeLessThanOrEqual(300);
    expect(athlete?.fx).toBe(athlete?.x);
    expect(athlete?.fy).toBe(athlete?.y);
    expect(athlete?.fz).toBe(athlete?.z);
    expect(typeof athlete?.clusterKey).toBe('string');
    expect(typeof athlete?.clusterIndex).toBe('number');
    expect(athlete?.importance).toBeGreaterThan(0);
    expect(typeof athlete?.eraAnchor).toBe('number');
    expect(typeof athlete?.anchorX).toBe('number');
    expect(typeof athlete?.anchorY).toBe('number');
    expect(typeof athlete?.anchorZ).toBe('number');
    expect(graphData.meta.labelNodeIds.length).toBeLessThanOrEqual(9);
    expect(graphData.meta.initialCamera.position.z).toBeGreaterThan(400);
    expect(
      graphData.links.every((link) => typeof link.color === 'string'),
    ).toBe(true);
  });
});
