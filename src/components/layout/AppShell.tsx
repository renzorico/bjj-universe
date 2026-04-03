import { HeroPanel } from '@/components/surfaces/HeroPanel';
import { InsightRail } from '@/components/surfaces/InsightRail';
import { DataPipelinePanel } from '@/components/surfaces/DataPipelinePanel';
import { GraphStage } from '@/features/graph/components/GraphStage';
import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

const snapshot = createUniverseSnapshot();

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,162,255,0.22),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(80,227,194,0.14),_transparent_24%),linear-gradient(180deg,_rgba(6,12,24,0.4),_transparent_35%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs tracking-[0.35em] text-[var(--text-muted)] uppercase">
              Phase 1 Foundation
            </p>
            <h1 className="font-display text-3xl tracking-[0.08em] text-white sm:text-4xl">
              BJJ Universe
            </h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] backdrop-blur">
            Graph-first ADCC exploration
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <HeroPanel />
          <InsightRail snapshot={snapshot} />
        </section>

        <section className="grid flex-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <GraphStage snapshot={snapshot} />
          <DataPipelinePanel />
        </section>
      </main>
    </div>
  );
}
