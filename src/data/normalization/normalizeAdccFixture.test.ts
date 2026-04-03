import fixture from '@/data/fixtures/adcc-sample.fixture.json';
import { normalizeAdccFixture } from '@/data/normalization/normalizeAdccFixture';
import { buildAthleteMetrics } from '@/data/metrics/buildAthleteMetrics';
import { buildGraphViewModel } from '@/data/graph/buildGraphViewModel';
import { RawAdccFixture } from '@/domain/types';

describe('normalizeAdccFixture', () => {
  it('creates normalized athletes, events, and graph-ready metrics from the sample fixture', () => {
    const normalized = normalizeAdccFixture(fixture as RawAdccFixture);
    const metrics = buildAthleteMetrics(normalized);
    const graph = buildGraphViewModel(normalized, metrics);

    expect(normalized.events).toHaveLength(3);
    expect(normalized.matches).toHaveLength(6);
    expect(normalized.athletes).toHaveLength(7);

    const jtTorres = metrics.athletes.get('athlete_jt-torres');

    expect(jtTorres).toMatchObject({
      wins: 1,
      losses: 1,
      rivalryCount: 2,
      yearsActive: [2019, 2022],
    });

    expect(metrics.topRivalries[0]).toEqual({
      id: 'athlete_craig-jones__athlete_kaynan-duarte',
      label: 'Craig Jones vs Kaynan Duarte',
      matches: 2,
    });

    expect(graph.nodes[0]).toMatchObject({
      id: 'athlete_jt-torres',
    });
    expect(graph.edges[0]).toMatchObject({
      source: 'athlete_jt-torres',
      target: 'athlete_lucas-lepri',
    });
  });
});
