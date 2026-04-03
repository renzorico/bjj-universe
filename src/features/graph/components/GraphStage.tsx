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
    <section className="relative z-10 rounded-[30px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] text-[var(--accent-soft)] uppercase">
            Live Graph
          </p>
          <h2 className="font-display text-3xl text-white">
            The first interactive BJJ Universe scene
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            This MVP uses Sigma.js on top of the existing typed view-model
            layer. Filters and selection live in React; the mutable graph and
            renderer do not.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-[var(--text-secondary)]">
          {scene.nodes.length} athletes · {scene.edges.length} visible matches
        </div>
      </header>

      <GraphControls
        filters={filters}
        years={scene.years}
        divisions={scene.divisions}
        onChange={(nextFilters) => {
          setFilters(nextFilters);
          setSelectedAthleteId(null);
        }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-4">
          <GraphCanvas
            graph={sigmaGraph}
            selectedAthleteId={selectedAthleteId}
            hoveredAthleteId={hoveredAthleteId}
            onSelectAthlete={setSelectedAthleteId}
            onHoverAthlete={setHoveredAthleteId}
          />
          <AthleteList
            athletes={scene.nodes}
            selectedAthleteId={selectedAthleteId}
            onSelectAthlete={setSelectedAthleteId}
          />
        </div>

        <div className="space-y-4">
          <AthleteDetailPanel
            detail={detail}
            onClearSelection={() => setSelectedAthleteId(null)}
          />
          <aside className="rounded-[24px] border border-white/10 bg-black/20 p-5">
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Interaction notes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Click a node to lock selection and dim unrelated paths.</li>
              <li>Hover a node to preview its local neighborhood.</li>
              <li>Use rivalry mode to emphasize repeat pairings.</li>
              <li>Use era mode to tint edges by match year.</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
