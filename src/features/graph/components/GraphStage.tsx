import { SurfaceCard } from '@/components/surfaces/SurfaceCard';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

export function GraphStage({ snapshot }: { snapshot: UniverseSnapshot }) {
  return (
    <SurfaceCard
      eyebrow="Constellation Stage"
      title="Graph-first shell"
      description="This placeholder stage already uses fixture-backed node and edge projections. A future Sigma scene can replace the visual layer without disrupting the data model."
      className="min-h-[520px]"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GraphBackdrop nodes={snapshot.nodes} edges={snapshot.edges} />
        <aside className="space-y-4">
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Promising questions
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Which athletes bridge otherwise isolated eras?</li>
              <li>Which elite matchups are conspicuously absent?</li>
              <li>Where do rivalry clusters form across divisions?</li>
            </ul>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Ready for phase 2
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Add a real Sigma renderer, camera controls, filters, event
              timelines, and richer athlete detail panes on top of the existing
              view-model contract.
            </p>
          </div>
        </aside>
      </div>
    </SurfaceCard>
  );
}

function GraphBackdrop({
  nodes,
  edges,
}: Pick<UniverseSnapshot, 'nodes' | 'edges'>) {
  return (
    <div
      aria-label="Graph stage preview"
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(122,162,255,0.18),_transparent_42%)]" />

      {edges.map((edge) => (
        <div
          key={edge.id}
          className="absolute h-px origin-left bg-[linear-gradient(90deg,_rgba(255,255,255,0),_rgba(255,255,255,0.35),_rgba(255,255,255,0))]"
          style={{
            left: `${edge.sourcePosition.x}%`,
            top: `${edge.sourcePosition.y}%`,
            width: `${edge.length}%`,
            transform: `rotate(${edge.angle}deg)`,
          }}
        />
      ))}

      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${node.position.x}%`,
            top: `${node.position.y}%`,
          }}
        >
          <div
            className="rounded-full border border-white/20 bg-[radial-gradient(circle,_rgba(122,162,255,0.9),_rgba(122,162,255,0.18))] shadow-[0_0_24px_rgba(122,162,255,0.45)]"
            style={{
              width: `${node.size}px`,
              height: `${node.size}px`,
            }}
          />
          <p className="mt-2 text-xs tracking-[0.2em] whitespace-nowrap text-[var(--text-muted)] uppercase">
            {node.label}
          </p>
        </div>
      ))}
    </div>
  );
}
