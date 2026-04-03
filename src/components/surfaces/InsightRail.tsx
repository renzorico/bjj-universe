import { SurfaceCard } from '@/components/surfaces/SurfaceCard';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

export function InsightRail({ snapshot }: { snapshot: UniverseSnapshot }) {
  return (
    <SurfaceCard
      eyebrow="Network Snapshot"
      title="Initial graph intelligence"
      description="Fixture-backed analytics prove the data contract and graph projection approach before real ADCC ingestion arrives."
    >
      <div className="space-y-4">
        <InsightRow
          label="Athletes"
          value={snapshot.summary.athleteCount.toString()}
        />
        <InsightRow
          label="Matches"
          value={snapshot.summary.matchCount.toString()}
        />
        <InsightRow
          label="Events"
          value={snapshot.summary.eventCount.toString()}
        />
        <InsightRow
          label="Top bridge"
          value={snapshot.summary.topBridgeAthlete}
        />
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Rivalry Heat
        </p>
        <div className="mt-4 space-y-3">
          {snapshot.topRivalries.map((rivalry) => (
            <div key={rivalry.id}>
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>{rivalry.label}</span>
                <span>{rivalry.matches} bouts</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_var(--accent),_var(--accent-secondary))]"
                  style={{ width: `${Math.min(100, rivalry.matches * 32)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
      <span className="text-sm tracking-[0.22em] text-[var(--text-muted)] uppercase">
        {label}
      </span>
      <span className="font-display text-lg text-white">{value}</span>
    </div>
  );
}
