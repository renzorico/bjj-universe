import { useMemo, useState } from 'react';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';
import {
  buildGraphSceneModel,
  createDefaultGraphFilters,
  getAthleteDetail,
} from '@/features/graph/lib/buildGraphSceneModel';
import { buildSigmaGraph } from '@/features/graph/lib/buildSigmaGraph';
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

  const scene = useMemo(
    () => buildGraphSceneModel(snapshot, filters),
    [filters, snapshot],
  );
  const sigmaGraph = useMemo(
    () => buildSigmaGraph(scene.nodes, scene.edges),
    [scene.edges, scene.nodes],
  );
  const detail = useMemo(
    () => getAthleteDetail(scene, selectedAthleteId),
    [scene, selectedAthleteId],
  );

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-7.5rem)] flex-col rounded-[30px] border border-white/10 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-5">
      <header className="mb-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
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
            compact
            filters={filters}
            years={scene.years}
            divisions={scene.divisions}
            onChange={(nextFilters) => {
              setFilters(nextFilters);
              setSelectedAthleteId(null);
            }}
          />
        </div>
      </header>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[58vh] xl:min-h-0">
          <GraphCanvas
            graph={sigmaGraph}
            selectedAthleteId={selectedAthleteId}
            hoveredAthleteId={hoveredAthleteId}
            onSelectAthlete={setSelectedAthleteId}
            onHoverAthlete={setHoveredAthleteId}
          />
        </div>

        <aside className="grid gap-4 xl:grid-rows-[minmax(0,1fr)_auto_auto]">
          <AthleteDetailPanel
            detail={detail}
            onClearSelection={() => setSelectedAthleteId(null)}
          />

          <AthleteList
            athletes={scene.nodes}
            selectedAthleteId={selectedAthleteId}
            onSelectAthlete={setSelectedAthleteId}
          />

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
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
        </aside>
      </div>
    </section>
  );
}
