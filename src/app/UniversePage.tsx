import { AppLink } from '@/app/AppLink';
import { AppRoute } from '@/app/useAppRoute';
import { GraphStage } from '@/features/graph/components/GraphStage';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

interface UniversePageProps {
  onNavigate: (route: AppRoute) => void;
  snapshot: UniverseSnapshot;
}

export function UniversePage({ onNavigate, snapshot }: UniversePageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(122,162,255,0.18),_transparent_34%),radial-gradient(circle_at_78%_24%,_rgba(80,227,194,0.12),_transparent_24%),linear-gradient(180deg,_rgba(6,12,24,0.25),_rgba(4,10,17,0.08)_30%,_rgba(4,10,17,0)_100%)]" />
      <main className="relative flex min-h-screen flex-col px-4 py-4 lg:px-6">
        <header className="mb-4 grid items-center gap-4 rounded-[24px] border border-white/10 bg-[rgba(5,10,18,0.64)] px-5 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-4">
            <AppLink
              href="/"
              onNavigate={onNavigate}
              className="rounded-full border border-white/10 px-3 py-2 text-xs tracking-[0.18em] text-[var(--text-secondary)] uppercase transition hover:bg-white/8"
            >
              Overview
            </AppLink>
            <div>
              <p className="text-xs tracking-[0.22em] text-[var(--text-muted)] uppercase">
                BJJ Universe
              </p>
              <h1 className="font-display text-2xl text-white lg:text-3xl">
                Node graph explorer
              </h1>
            </div>
          </div>

          <div className="justify-self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.18em] text-[var(--accent-soft)] uppercase lg:justify-self-center">
            Universe route
          </div>

          <div className="justify-self-start text-left lg:justify-self-end lg:text-right">
            <p className="text-xs tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Section
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Real ADCC graph exploration
            </p>
          </div>
        </header>

        <div className="flex-1">
          <GraphStage snapshot={snapshot} />
        </div>
      </main>
    </div>
  );
}
