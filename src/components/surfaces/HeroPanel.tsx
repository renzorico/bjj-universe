import { SurfaceCard } from '@/components/surfaces/SurfaceCard';

const heroBullets = [
  'Track winner-to-loser pathways across eras, divisions, and rivalries.',
  'Separate raw ingestion, normalization, metrics, graph construction, and UI view models.',
  'Build toward live network analytics, inferred matchups, and cinematic graph exploration.',
];

export function HeroPanel() {
  return (
    <SurfaceCard
      eyebrow="Vision"
      title="A living grappling atlas, not a dashboard"
      description="Phase 1 establishes a premium shell for a network-native product: dark, atmospheric, graph-led, and strict about data boundaries."
      className="overflow-hidden"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            The eventual product treats athletes as celestial bodies and matches
            as the force lines between them. Users should feel like they are
            navigating an evolving competition universe.
          </p>
          <ul className="space-y-3">
            {heroBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
              >
                <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricTile
            label="Primary Source"
            value="ADCC"
            detail="Historical fixture contract in place"
          />
          <MetricTile
            label="Pipeline Layers"
            value="4"
            detail="Raw, normalized, metrics, graph"
          />
          <MetricTile
            label="Test Surface"
            value="3"
            detail="Unit, component, and e2e configured"
          />
          <MetricTile
            label="Design Direction"
            value="Cinematic"
            detail="Atmospheric shell for future graph rendering"
          />
        </div>
      </div>
    </SurfaceCard>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.1),_rgba(255,255,255,0.02))] p-5">
      <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
        {label}
      </p>
      <p className="font-display mt-4 text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {detail}
      </p>
    </div>
  );
}
