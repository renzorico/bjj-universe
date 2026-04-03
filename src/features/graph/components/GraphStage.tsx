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
  const [filters, setFilters] = useState(() =>
    createDefaultGraphFilters(snapshot),
  );
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null,
  );
  const [hoveredAthleteId, setHoveredAthleteId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const scene = useMemo(
    () => buildGraphSceneModel(snapshot, filters),
    [filters, snapshot],
  );
  const graphData = useMemo(
    () => buildForceGraphData(scene.nodes, scene.edges),
    [scene.edges, scene.nodes],
  );
  const detail = useMemo(
    () => getAthleteDetail(scene, selectedAthleteId),
    [scene, selectedAthleteId],
  );

  const handleSelectAthlete = (athleteId: string | null) => {
    setSelectedAthleteId(athleteId);

    if (athleteId) {
      setDetailOpen(true);
    }
  };

  return (
    <section className="relative z-10 h-[calc(100vh-6.5rem)] min-h-[720px] overflow-hidden rounded-[30px] border border-white/10 bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <GraphCanvas
        data={graphData}
        selectedAthleteId={selectedAthleteId}
        hoveredAthleteId={hoveredAthleteId}
        onSelectAthlete={handleSelectAthlete}
        onHoverAthlete={setHoveredAthleteId}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute top-4 right-4 left-4 max-w-[min(980px,calc(100%-2rem))]">
          <div className="rounded-[24px] border border-white/10 bg-[rgba(5,10,18,0.72)] p-4 shadow-[0_16px_56px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.28em] text-[var(--accent-soft)] uppercase">
                  Universe explorer
                </p>
                <h2 className="font-display text-3xl text-white">
                  Real ADCC graph explorer
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)]">
                {scene.nodes.length} athletes · {scene.edges.length} visible
                matches
              </div>
            </div>

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
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-4 w-[min(360px,calc(100%-2rem))]">
          <AthleteList
            athletes={scene.nodes}
            selectedAthleteId={selectedAthleteId}
            onSelectAthlete={handleSelectAthlete}
          />
        </div>

        <div className="pointer-events-auto absolute top-4 right-4 flex max-w-[calc(100%-2rem)] flex-col items-end gap-3">
          <button
            type="button"
            aria-expanded={detailOpen}
            className="rounded-full border border-white/10 bg-[rgba(5,10,18,0.78)] px-4 py-3 text-left shadow-[0_16px_56px_rgba(0,0,0,0.38)] backdrop-blur-xl transition hover:bg-[rgba(8,14,24,0.88)]"
            onClick={() => setDetailOpen((value) => !value)}
          >
            <span className="block text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Athlete detail
            </span>
            <span className="mt-1 block text-sm text-white">
              {detail?.athlete.label ?? 'Select an athlete'}
            </span>
          </button>

          {detailOpen ? (
            <div className="w-[min(420px,calc(100vw-2rem))]">
              <AthleteDetailPanel
                detail={detail}
                onClearSelection={() => {
                  setSelectedAthleteId(null);
                  setDetailOpen(false);
                }}
              />
            </div>
          ) : null}

          <button
            type="button"
            aria-expanded={notesOpen}
            className="rounded-full border border-white/10 bg-[rgba(5,10,18,0.78)] px-4 py-3 text-left shadow-[0_16px_56px_rgba(0,0,0,0.38)] backdrop-blur-xl transition hover:bg-[rgba(8,14,24,0.88)]"
            onClick={() => setNotesOpen((value) => !value)}
          >
            <span className="block text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Interaction notes
            </span>
            <span className="mt-1 block text-sm text-white">
              Selection, hover, rivalry, era
            </span>
          </button>

          {notesOpen ? (
            <div className="w-[min(360px,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-[rgba(5,10,18,0.9)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl">
              <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
                Interaction notes
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                <li>Click a node to lock selection and dim unrelated paths.</li>
                <li>Hover a node to preview its local neighborhood.</li>
                <li>Use rivalry mode to emphasize repeat pairings.</li>
                <li>Use era mode to tint edges by match year.</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
