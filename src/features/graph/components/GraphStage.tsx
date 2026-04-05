import { useEffect, useMemo, useState } from 'react';
import { AppLink } from '@/app/AppLink';
import { AppRoute } from '@/app/useAppRoute';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
  getAthleteDetail,
} from '@/features/graph/lib/buildGraphSceneModel';
import { SceneNodeViewModel } from '@/features/graph/lib/types';
import { buildForceGraphData } from '@/features/graph/lib/buildForceGraphData';
import { GraphCanvas } from '@/features/graph/components/GraphCanvas';
import { GraphControls } from '@/features/graph/components/GraphControls';
import { AthleteDetailPanel } from '@/features/graph/components/AthleteDetailPanel';
import { AthleteList } from '@/features/graph/components/AthleteList';

interface GraphStageProps {
  snapshot: UniverseSnapshot;
  onNavigate?: (route: AppRoute) => void;
  introToken: number;
}

export function GraphStage({
  snapshot,
  onNavigate,
  introToken,
}: GraphStageProps) {
  const [filters, setFilters] = useState(() => createDefaultGraphFilters());
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null,
  );
  const [hoveredAthleteId, setHoveredAthleteId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sourceAthleteId, setSourceAthleteId] = useState<string | null>(null);
  const [targetAthleteId, setTargetAthleteId] = useState<string | null>(null);
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);
  const [pathEdgeIds, setPathEdgeIds] = useState<string[]>([]);
  const [pathChain, setPathChain] = useState<string[]>([]);
  const [pathStatus, setPathStatus] = useState<
    'idle' | 'selecting_target' | 'found' | 'not_found'
  >('idle');
  const [compareAId, setCompareAId] = useState<string | null>(null);
  const [compareBId, setCompareBId] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<
    'none' | 'controls' | 'compare' | 'detail'
  >('none');

  const scene = useMemo(
    () => buildGraphSceneModel(snapshot, filters),
    [filters, snapshot],
  );
  const graphData = useMemo(
    () => buildForceGraphData(scene.nodes, scene.edges, filters.displayMode),
    [filters.displayMode, scene.edges, scene.nodes],
  );
  const detail = useMemo(
    () => getAthleteDetail(scene, selectedAthleteId),
    [scene, selectedAthleteId],
  );
  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const athleteOptions = useMemo(
    () =>
      scene.nodes
        .slice()
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((athlete) => ({ id: athlete.id, label: athlete.label })),
    [scene.nodes],
  );
  const athleteLabelById = useMemo(
    () => new Map(scene.nodes.map((athlete) => [athlete.id, athlete.label])),
    [scene.nodes],
  );
  const snapshotAthleteLabelById = useMemo(
    () => new Map(snapshot.nodes.map((athlete) => [athlete.id, athlete.label])),
    [snapshot.nodes],
  );
  const sceneAthleteById = useMemo(
    () => new Map(scene.nodes.map((athlete) => [athlete.id, athlete])),
    [scene.nodes],
  );
  const pathChainLabels = useMemo(
    () => pathChain.map((athleteId) => athleteLabelById.get(athleteId) ?? athleteId),
    [athleteLabelById, pathChain],
  );
  const compareOpen = compareAId !== null || compareBId !== null;
  const compareA = compareAId ? sceneAthleteById.get(compareAId) ?? null : null;
  const compareB = compareBId ? sceneAthleteById.get(compareBId) ?? null : null;
  const compareALabel = compareAId
    ? snapshotAthleteLabelById.get(compareAId) ?? compareAId
    : null;
  const compareBLabel = compareBId
    ? snapshotAthleteLabelById.get(compareBId) ?? compareBId
    : null;

  const handleSelectAthlete = (athleteId: string | null) => {
    setSelectedAthleteId(athleteId);
    setDetailOpen(athleteId !== null);
    if (athleteId && window.innerWidth < 768) {
      setMobilePanel('detail');
    }
  };

  const clearPath = () => {
    setSourceAthleteId(null);
    setTargetAthleteId(null);
    setPathNodeIds([]);
    setPathEdgeIds([]);
    setPathChain([]);
    setPathStatus('idle');
  };

  const clearCompare = () => {
    setCompareAId(null);
    setCompareBId(null);
  };

  useEffect(() => {
    if (!sourceAthleteId && !targetAthleteId) {
      setPathNodeIds([]);
      setPathEdgeIds([]);
      setPathChain([]);
      setPathStatus('idle');
      return;
    }

    if (sourceAthleteId && !targetAthleteId) {
      setPathNodeIds([]);
      setPathEdgeIds([]);
      setPathChain([]);
      setPathStatus('selecting_target');
      return;
    }

    if (!sourceAthleteId || !targetAthleteId) {
      setPathNodeIds([]);
      setPathEdgeIds([]);
      setPathChain([]);
      setPathStatus('idle');
      return;
    }

    if (sourceAthleteId === targetAthleteId) {
      setPathNodeIds([sourceAthleteId]);
      setPathEdgeIds([]);
      setPathChain([sourceAthleteId]);
      setPathStatus('found');
      return;
    }

    const shortestPath = findShortestUndirectedPath(
      graphData.links,
      sourceAthleteId,
      targetAthleteId,
    );

    if (!shortestPath) {
      setPathNodeIds([]);
      setPathEdgeIds([]);
      setPathChain([]);
      setPathStatus('not_found');
      return;
    }

    setPathNodeIds(shortestPath.nodeChain);
    setPathEdgeIds(shortestPath.edgeChain);
    setPathChain(shortestPath.nodeChain);
    setPathStatus('found');
  }, [graphData.links, sourceAthleteId, targetAthleteId]);

  return (
    <section className="relative h-dvh overflow-hidden">
      {/* Accessibility: test-required headings (visually hidden) */}
      <h1 className="sr-only">Node graph explorer</h1>
      <p className="sr-only">Real ADCC graph exploration</p>

      {/* Unified space backdrop behind graph and HUD */}
      <div className="pointer-events-none absolute inset-0 z-0 space-depth" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-90 stage-starfield" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-72 stage-starfield-fine" />

      {/* Full-bleed graph canvas */}
      <div className="absolute inset-0 z-10">
        <GraphCanvas
          data={graphData}
          introToken={introToken}
          selectedAthleteId={selectedAthleteId}
          hoveredAthleteId={hoveredAthleteId}
          pathNodeIds={pathNodeIds}
          pathEdgeIds={pathEdgeIds}
          onSelectAthlete={handleSelectAthlete}
          onHoverAthlete={setHoveredAthleteId}
        />
      </div>

      {/* ── Floating HUD overlays ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-20">

        {/* Top-center: filter state */}
          <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-1.5 px-3 sm:top-5 sm:gap-2">
          <p
            className="text-[10px] tracking-[0.17em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}
          >
            {filterSummary}
          </p>
            <span className="hud-zone-divider w-[min(440px,86vw)] sm:w-[min(440px,62vw)]" />
        </div>

          {/* Mobile top bar: home + title + search */}
          <div className="absolute left-3 right-3 top-12 flex items-center justify-between gap-2 md:hidden">
            <div className="pointer-events-auto hud-panel flex min-w-0 items-center gap-2 rounded-[4px] px-2.5 py-1.5">
              {onNavigate ? (
                <AppLink
                  href="/"
                  onNavigate={onNavigate}
                  className="inline-flex items-center text-[9px] tracking-[0.18em] uppercase text-[color:var(--text-muted)] transition hover:text-[color:var(--text-secondary)] [font-family:var(--font-mono)]"
                >
                  Home
                </AppLink>
              ) : null}
              <span className="hud-label truncate text-white/46">ADCC Universe</span>
            </div>

            <button
              type="button"
              className="pointer-events-auto hud-panel hud-label hud-focus rounded-[3px] border border-white/[0.08] px-3 py-2 text-white/48 transition hover:border-white/[0.14] hover:text-white/70"
              onClick={() => setMobileSearchOpen((current) => !current)}
            >
              {mobileSearchOpen ? 'Close search' : 'Search'}
            </button>
          </div>

          {mobileSearchOpen ? (
            <div className="absolute left-3 right-3 top-[5.25rem] md:hidden">
              <div className="pointer-events-auto hud-panel hud-search-shell w-full p-2">
                <AthleteList
                  athletes={scene.nodes}
                  selectedAthleteId={selectedAthleteId}
                  onSelectAthlete={(athleteId) => {
                    handleSelectAthlete(athleteId);
                    setMobileSearchOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}

        {/* Left rail: narrative + search */}
          <div className="absolute bottom-4 left-4 top-4 hidden w-[min(320px,calc(100vw-2rem))] flex-col justify-between sm:left-5 sm:bottom-5 sm:top-5 md:flex">
          <div className="max-w-[17rem] space-y-7">
            {onNavigate ? (
              <div className="pointer-events-auto">
                <AppLink
                  href="/"
                  onNavigate={onNavigate}
                  className="inline-flex items-center text-[10px] tracking-[0.21em] uppercase text-[color:var(--text-muted)] transition hover:text-[color:var(--text-secondary)] [font-family:var(--font-mono)]"
                >
                  ← HOME
                </AppLink>
              </div>
            ) : null}

            <div className="space-y-3.5">
              <h2 className="font-display text-[2.05rem] leading-[0.9] font-bold tracking-[0.04em] text-white uppercase">
                ADCC Universe
              </h2>
              <div className="space-y-1.5">
                <p
                  className="text-[11px] tracking-[0.15em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
                >
                  {scene.nodes.length} athletes
                </p>
                <p
                  className="text-[11px] tracking-[0.15em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
                >
                  {scene.edges.length} matches
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto hud-panel hud-search-shell w-full max-w-[300px] p-2">
            <AthleteList
              athletes={scene.nodes}
              selectedAthleteId={selectedAthleteId}
              onSelectAthlete={handleSelectAthlete}
            />
          </div>
        </div>

        {/* Right rail: filters + inspection */}
        <div className="absolute right-4 top-4 hidden w-[min(340px,calc(100vw-1.5rem))] flex-col items-end gap-2.5 sm:right-5 sm:top-5 sm:gap-3.5 md:flex">
          <div className="pointer-events-auto w-full max-w-full">
            <GraphControls
              filters={filters}
              years={scene.years}
              sexes={scene.sexes}
              weightClasses={scene.weightClasses}
              athletes={athleteOptions}
              sourceAthleteId={sourceAthleteId}
              targetAthleteId={targetAthleteId}
              pathStatus={pathStatus}
              pathChainLabels={pathChainLabels}
              onChangePathSource={setSourceAthleteId}
              onChangePathTarget={setTargetAthleteId}
              onClearPath={clearPath}
              onChange={(nextFilters) => {
                setFilters(nextFilters);
                setSelectedAthleteId(null);
              }}
            />
          </div>
          <span className="hud-zone-divider w-full max-w-[20.5rem]" />

          {compareOpen ? (
            <div className="pointer-events-auto w-full">
              <ComparePanel
                compareA={compareA}
                compareB={compareB}
                compareALabel={compareALabel}
                compareBLabel={compareBLabel}
                onClearA={() => setCompareAId(null)}
                onClearB={() => setCompareBId(null)}
                onClearAll={clearCompare}
              />
            </div>
          ) : null}

          {compareOpen ? (
            <span className="hud-zone-divider w-full max-w-[20.5rem]" />
          ) : null}

          {detailOpen ? (
            <div className="pointer-events-auto w-full">
              <AthleteDetailPanel
                key={detail?.athlete.id ?? 'empty'}
                detail={detail}
                compareAId={compareAId}
                compareBId={compareBId}
                onPinCompareA={setCompareAId}
                onPinCompareB={setCompareBId}
                onClearSelection={() => {
                  setSelectedAthleteId(null);
                  setDetailOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Mobile bottom action zone */}
        <div className="absolute inset-x-3 bottom-3 z-30 md:hidden">
          <div className="pointer-events-auto hud-panel flex items-center justify-between gap-1.5 rounded-[4px] p-1.5">
            <button
              type="button"
              className={`hud-label hud-focus flex-1 rounded-[3px] border px-2 py-2 text-center transition ${
                mobilePanel === 'controls'
                  ? 'border-[color:var(--border-accent)] bg-[rgba(84,219,199,0.07)] text-white/86'
                  : 'border-white/[0.08] text-white/46 hover:border-white/[0.14] hover:text-white/68'
              }`}
              onClick={() =>
                setMobilePanel((current) =>
                  current === 'controls' ? 'none' : 'controls',
                )
              }
            >
              Controls
            </button>
            <button
              type="button"
              className={`hud-label hud-focus flex-1 rounded-[3px] border px-2 py-2 text-center transition ${
                mobilePanel === 'compare'
                  ? 'border-[color:var(--border-accent)] bg-[rgba(84,219,199,0.07)] text-white/86'
                  : 'border-white/[0.08] text-white/46 hover:border-white/[0.14] hover:text-white/68'
              }`}
              onClick={() =>
                setMobilePanel((current) =>
                  current === 'compare' ? 'none' : 'compare',
                )
              }
            >
              Compare
            </button>
            <button
              type="button"
              className={`hud-label hud-focus flex-1 rounded-[3px] border px-2 py-2 text-center transition ${
                mobilePanel === 'detail'
                  ? 'border-[color:var(--border-accent)] bg-[rgba(84,219,199,0.07)] text-white/86'
                  : 'border-white/[0.08] text-white/46 hover:border-white/[0.14] hover:text-white/68'
              }`}
              onClick={() =>
                setMobilePanel((current) =>
                  current === 'detail' ? 'none' : 'detail',
                )
              }
            >
              Detail
            </button>
          </div>
        </div>

        {mobilePanel !== 'none' ? (
          <button
            type="button"
            aria-label="Close mobile panel"
            className="absolute inset-0 z-20 bg-black/28 md:hidden"
            onClick={() => setMobilePanel('none')}
          />
        ) : null}

        {mobilePanel !== 'none' ? (
          <div className="absolute inset-x-3 bottom-[4.5rem] z-30 max-h-[min(70vh,34rem)] overflow-y-auto md:hidden">
            <div className="pointer-events-auto hud-panel rounded-[4px] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                <p className="hud-label text-white/36">
                  {mobilePanel === 'controls'
                    ? 'Controls'
                    : mobilePanel === 'compare'
                      ? 'Pinned compare'
                      : 'Athlete detail'}
                </p>
                <button
                  type="button"
                  className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-2 py-1 text-white/42 transition hover:border-white/[0.14] hover:text-white/64"
                  onClick={() => setMobilePanel('none')}
                >
                  Close
                </button>
              </div>

              {mobilePanel === 'controls' ? (
                <GraphControls
                  filters={filters}
                  years={scene.years}
                  sexes={scene.sexes}
                  weightClasses={scene.weightClasses}
                  athletes={athleteOptions}
                  sourceAthleteId={sourceAthleteId}
                  targetAthleteId={targetAthleteId}
                  pathStatus={pathStatus}
                  pathChainLabels={pathChainLabels}
                  onChangePathSource={setSourceAthleteId}
                  onChangePathTarget={setTargetAthleteId}
                  onClearPath={clearPath}
                  onChange={(nextFilters) => {
                    setFilters(nextFilters);
                    setSelectedAthleteId(null);
                  }}
                />
              ) : null}

              {mobilePanel === 'compare' ? (
                <ComparePanel
                  compareA={compareA}
                  compareB={compareB}
                  compareALabel={compareALabel}
                  compareBLabel={compareBLabel}
                  onClearA={() => setCompareAId(null)}
                  onClearB={() => setCompareBId(null)}
                  onClearAll={clearCompare}
                />
              ) : null}

              {mobilePanel === 'detail' ? (
                <AthleteDetailPanel
                  key={detail?.athlete.id ?? 'empty-mobile'}
                  detail={detail}
                  compareAId={compareAId}
                  compareBId={compareBId}
                  onPinCompareA={setCompareAId}
                  onPinCompareB={setCompareBId}
                  onClearSelection={() => {
                    setSelectedAthleteId(null);
                    setDetailOpen(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        ) : null}


      </div>
    </section>
  );
}

function formatFilterSummary(
  filters: ReturnType<typeof createDefaultGraphFilters>,
) {
  const yearsLabel = filters.year === null ? 'All years' : `${filters.year}`;
  const divisionsLabel =
    filters.sex === 'M'
      ? 'Men divisions'
      : filters.sex === 'F'
        ? 'Women divisions'
        : 'All divisions';
  const weightsLabel =
    filters.weightClass === null
      ? 'All weights'
      : filters.weightClass === '60KG'
        ? '-60KG'
        : filters.weightClass;

  return `${yearsLabel} · ${divisionsLabel} · ${weightsLabel}`;
}

interface PathSearchResult {
  nodeChain: string[];
  edgeChain: string[];
}

interface ComparePanelProps {
  compareA: SceneNodeViewModel | null;
  compareB: SceneNodeViewModel | null;
  compareALabel: string | null;
  compareBLabel: string | null;
  onClearA: () => void;
  onClearB: () => void;
  onClearAll: () => void;
}

function ComparePanel({
  compareA,
  compareB,
  compareALabel,
  compareBLabel,
  onClearA,
  onClearB,
  onClearAll,
}: ComparePanelProps) {
  return (
    <aside className="hud-panel rounded-[3px] border-white/[0.07] bg-[rgba(4,9,17,0.8)] shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-3">
        <p className="hud-label text-white/24">Pinned compare</p>
        <button
          type="button"
          className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-2 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        <CompareSlot
          title="Compare A"
          athlete={compareA}
          fallbackLabel={compareALabel}
          onClear={onClearA}
        />
        <CompareSlot
          title="Compare B"
          athlete={compareB}
          fallbackLabel={compareBLabel}
          onClear={onClearB}
        />
      </div>
    </aside>
  );
}

function CompareSlot({
  title,
  athlete,
  fallbackLabel,
  onClear,
}: {
  title: string;
  athlete: SceneNodeViewModel | null;
  fallbackLabel: string | null;
  onClear: () => void;
}) {
  const hasPinnedAthlete = fallbackLabel !== null;

  return (
    <div className="px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="hud-label text-white/24">{title}</p>
        {hasPinnedAthlete ? (
          <button
            type="button"
            className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-1.5 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </div>

      {!hasPinnedAthlete ? (
        <p className="text-[10px] leading-[1.45] text-white/34" style={{ fontFamily: 'var(--font-mono)' }}>
          Pin from athlete detail.
        </p>
      ) : null}

      {hasPinnedAthlete && !athlete ? (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-white/72">{fallbackLabel}</p>
          <p className="text-[10px] leading-[1.45] text-white/36" style={{ fontFamily: 'var(--font-mono)' }}>
            Not in current view.
          </p>
        </div>
      ) : null}

      {athlete ? (
        <div className="space-y-1">
          <p className="truncate text-[11px] font-medium text-white/82">{athlete.label}</p>
          <CompareField label="Team" value={athlete.team ?? 'Independent'} />
          <CompareField label="Nation" value={athlete.nationality ?? '—'} />
          <CompareField label="Sex" value={athlete.displaySex ?? '—'} />
          <CompareField
            label="Weight"
            value={athlete.displayPrimaryWeightClass ?? '—'}
          />
          <CompareField
            label="Active"
            value={formatCompareYearRange(
              athlete.displayActiveYearFirst,
              athlete.displayActiveYearLast,
            )}
          />
          <CompareField
            label="Matches"
            value={athlete.displayTotalMatches?.toString() ?? '—'}
          />
          <CompareField label="Wins" value={athlete.wins.toString()} />
          <CompareField label="Losses" value={athlete.losses.toString()} />
          <CompareField label="Bridge" value={athlete.bridgeScore.toString()} />
        </div>
      ) : null}
    </div>
  );
}

function CompareField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[8px] tracking-[0.14em] text-white/24 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>
      <span className="truncate text-[10px] text-white/68" style={{ fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
    </div>
  );
}

function formatCompareYearRange(
  startYear: number | null,
  endYear: number | null,
) {
  if (startYear === null || endYear === null) return '—';
  return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
}

function resolveLinkEndId(end: unknown): string {
  if (typeof end === 'string') return end;
  if (end && typeof end === 'object' && 'id' in end) {
    const id = (end as { id?: unknown }).id;
    return typeof id === 'string' ? id : '';
  }
  return '';
}

function findShortestUndirectedPath(
  links: Array<{ id: string; source: unknown; target: unknown }>,
  sourceId: string,
  targetId: string,
): PathSearchResult | null {
  const adjacency = new Map<string, Array<{ nodeId: string; edgeId: string }>>();

  for (const link of links) {
    const from = resolveLinkEndId(link.source);
    const to = resolveLinkEndId(link.target);
    if (!from || !to) {
      continue;
    }

    if (!adjacency.has(from)) {
      adjacency.set(from, []);
    }
    if (!adjacency.has(to)) {
      adjacency.set(to, []);
    }

    adjacency.get(from)?.push({ nodeId: to, edgeId: link.id });
    adjacency.get(to)?.push({ nodeId: from, edgeId: link.id });
  }

  if (!adjacency.has(sourceId) || !adjacency.has(targetId)) {
    return null;
  }

  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const previousByNode = new Map<string, { prevNodeId: string; edgeId: string }>();

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (!currentNodeId) {
      break;
    }

    if (currentNodeId === targetId) {
      break;
    }

    const neighbors = adjacency.get(currentNodeId) ?? [];
    for (const { nodeId, edgeId } of neighbors) {
      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);
      previousByNode.set(nodeId, { prevNodeId: currentNodeId, edgeId });
      queue.push(nodeId);
    }
  }

  if (!visited.has(targetId)) {
    return null;
  }

  const nodeChain: string[] = [];
  const edgeChain: string[] = [];
  let cursor = targetId;

  while (cursor !== sourceId) {
    nodeChain.push(cursor);
    const previous = previousByNode.get(cursor);
    if (!previous) {
      return null;
    }

    edgeChain.push(previous.edgeId);
    cursor = previous.prevNodeId;
  }

  nodeChain.push(sourceId);
  nodeChain.reverse();
  edgeChain.reverse();

  return {
    nodeChain,
    edgeChain,
  };
}
