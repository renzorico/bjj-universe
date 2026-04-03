import { useMemo, useState } from 'react';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
  getAthleteDetail,
} from '@/features/graph/lib/buildGraphSceneModel';
import { buildForceGraphData } from '@/features/graph/lib/buildForceGraphData';
import { GraphCanvas } from '@/features/graph/components/GraphCanvas';
import { GraphControls } from '@/features/graph/components/GraphControls';
import { AthleteDetailPanel } from '@/features/graph/components/AthleteDetailPanel';
import { AthleteList } from '@/features/graph/components/AthleteList';

export function GraphStage({ snapshot }: { snapshot: UniverseSnapshot }) {
  const [filters, setFilters] = useState(() => createDefaultGraphFilters());
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null,
  );
  const [hoveredAthleteId, setHoveredAthleteId] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

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

  const handleSelectAthlete = (athleteId: string | null) => {
    setSelectedAthleteId(athleteId);

    if (athleteId) {
      setDetailOpen(true);
      setNotesOpen(false);
    }
  };

  return (
    <section className="relative z-10 h-full min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <GraphCanvas
        data={graphData}
        selectedAthleteId={selectedAthleteId}
        hoveredAthleteId={hoveredAthleteId}
        onSelectAthlete={handleSelectAthlete}
        onHoverAthlete={setHoveredAthleteId}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 bottom-3 flex flex-col justify-between sm:inset-x-4 sm:top-4 sm:bottom-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="pointer-events-auto flex max-w-[min(640px,100%)] flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-white/8 bg-[rgba(5,10,18,0.58)] px-3 py-1.5 text-[10px] tracking-[0.16em] text-[var(--text-secondary)] uppercase shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {scene.nodes.length} athletes · {scene.edges.length} matches
              </div>
              <button
                type="button"
                className="h-8 rounded-full border border-white/8 bg-[rgba(5,10,18,0.58)] px-3 text-[10px] tracking-[0.16em] text-white uppercase shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-[rgba(8,14,24,0.78)]"
                onClick={() => setControlsOpen((value) => !value)}
              >
                {controlsOpen ? 'Hide filters' : 'Filters'}
              </button>
              <div className="hidden rounded-full border border-white/8 bg-[rgba(5,10,18,0.5)] px-3 py-1.5 text-[10px] text-[var(--text-secondary)] shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl lg:block">
                {filterSummary}
              </div>
            </div>

            {controlsOpen ? (
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto rounded-[20px] border border-white/8 bg-[rgba(5,10,18,0.62)] p-3 shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-3.5">
                <GraphControls
                  filters={filters}
                  years={scene.years}
                  sexes={scene.sexes}
                  weightClasses={scene.weightClasses}
                  onChange={(nextFilters) => {
                    setFilters(nextFilters);
                    setSelectedAthleteId(null);
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="pointer-events-auto flex flex-wrap gap-2 xl:max-w-[180px] xl:flex-col xl:items-end">
            <button
              type="button"
              aria-label="Athlete detail"
              aria-expanded={detailOpen}
              className="rounded-full border border-white/8 bg-[rgba(5,10,18,0.56)] px-3 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-[rgba(8,14,24,0.76)]"
              onClick={() => {
                setDetailOpen((value) => !value);
                setNotesOpen(false);
              }}
            >
              <span className="block text-[10px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
                Athlete detail
              </span>
              <span className="mt-0.5 block text-sm text-white">Detail</span>
            </button>

            <button
              type="button"
              aria-label="Interaction notes"
              aria-expanded={notesOpen}
              className="rounded-full border border-white/8 bg-[rgba(5,10,18,0.56)] px-3 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-[rgba(8,14,24,0.76)]"
              onClick={() => {
                setNotesOpen((value) => !value);
                setDetailOpen(false);
              }}
            >
              <span className="block text-[10px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
                Interaction notes
              </span>
              <span className="mt-0.5 block text-sm text-white">Notes</span>
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="pointer-events-auto w-[min(320px,calc(100%-5rem))] sm:w-[min(320px,calc(100%-7rem))]">
            <AthleteList
              athletes={scene.nodes}
              selectedAthleteId={selectedAthleteId}
              onSelectAthlete={handleSelectAthlete}
            />
          </div>
        </div>

        {detailOpen ? (
          <div className="pointer-events-auto absolute top-16 right-0 max-h-[calc(100%-4rem)] w-[min(392px,calc(100vw-1.5rem))] overflow-y-auto sm:top-[4.5rem]">
            <AthleteDetailPanel
              detail={detail}
              onClearSelection={() => {
                setSelectedAthleteId(null);
                setDetailOpen(false);
              }}
            />
          </div>
        ) : null}

        {notesOpen ? (
          <div className="pointer-events-auto absolute top-16 right-0 w-[min(292px,calc(100vw-1.5rem))] rounded-[20px] border border-white/8 bg-[rgba(5,10,18,0.82)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:top-[4.5rem]">
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Interaction notes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Use the search bar to inspect an athlete profile quickly.</li>
              <li>
                Filters reflect the live ADCC dataset even in design mode.
              </li>
              <li>
                The graph stage is intentionally static while the explorer UI is
                being polished.
              </li>
            </ul>
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
  const sexLabel =
    filters.sex === 'M' ? 'Men' : filters.sex === 'F' ? 'Women' : 'All sexes';

  return `${yearsLabel} · ${sexLabel} · ${filters.weightClass ?? 'All weights'}`;
}
