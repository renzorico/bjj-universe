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
    <div className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(122,162,255,0.18),_transparent_34%),radial-gradient(circle_at_78%_24%,_rgba(80,227,194,0.12),_transparent_24%),linear-gradient(180deg,_rgba(6,12,24,0.25),_rgba(4,10,17,0.08)_30%,_rgba(4,10,17,0)_100%)]" />
      <main className="relative flex h-screen flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <header className="mb-3 rounded-[22px] border border-white/8 bg-[rgba(5,10,18,0.54)] px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:mb-4 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <AppLink
                href="/"
                onNavigate={onNavigate}
                className="rounded-full border border-white/8 px-3 py-2 text-[10px] tracking-[0.18em] text-[var(--text-secondary)] uppercase transition hover:bg-white/8"
              >
                Overview
              </AppLink>
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.24em] text-[var(--text-muted)] uppercase">
                  BJJ Universe
                </p>
                <h1 className="font-display text-[1.85rem] leading-none text-white sm:text-[2.2rem]">
                  Node graph explorer
                </h1>
              </div>
            </div>

            <div className="hidden lg:block" />

            <div className="min-w-0 lg:justify-self-end">
              <p className="text-[10px] tracking-[0.24em] text-[var(--text-muted)] uppercase lg:text-right">
                Section
              </p>
              <p className="truncate text-sm text-[var(--text-secondary)] lg:text-right">
                Real ADCC graph exploration
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1">
          <GraphStage snapshot={snapshot} />
        </div>
      </main>
    </div>
  );
}
