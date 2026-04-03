import { AppLink } from '@/app/AppLink';
import { AppRoute } from '@/app/useAppRoute';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
  snapshot: UniverseSnapshot;
}

export function LandingPage({ onNavigate, snapshot }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,162,255,0.22),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(80,227,194,0.14),_transparent_24%),linear-gradient(180deg,_rgba(6,12,24,0.4),_transparent_35%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs tracking-[0.35em] text-[var(--text-muted)] uppercase">
              Graph-first ADCC exploration
            </p>
            <h1 className="font-display text-3xl tracking-[0.08em] text-white sm:text-4xl">
              BJJ Universe
            </h1>
          </div>
          <AppLink
            href="/universe"
            onNavigate={onNavigate}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] backdrop-blur transition hover:bg-white/10"
          >
            Enter explorer
          </AppLink>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--accent-soft)] uppercase">
              Living grappling atlas
            </p>
            <h2 className="font-display mt-4 max-w-4xl text-5xl leading-[0.92] text-white sm:text-6xl">
              A dedicated network explorer for rivalry, eras, and hidden
              structure in ADCC history.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              BJJ Universe turns competition history into a navigable graph.
              Athletes become nodes, matches become directional edges, and the
              main experience lives in a full-screen universe route designed for
              inspection instead of page clutter.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <AppLink
                href="/universe"
                onNavigate={onNavigate}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#05101d] transition hover:brightness-110"
              >
                Open the universe
              </AppLink>
              <a
                href="#dataset"
                className="rounded-full border border-white/10 px-6 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-white/8"
              >
                See current data scope
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <StatCard
              label="Athletes"
              value={snapshot.summary.athleteCount.toString()}
            />
            <StatCard
              label="Observed matches"
              value={snapshot.summary.matchCount.toString()}
            />
            <StatCard
              label="Events"
              value={snapshot.summary.eventCount.toString()}
            />
            <StatCard
              label="Top bridge athlete"
              value={snapshot.summary.topBridgeAthlete}
            />
          </div>
        </section>

        <section
          id="dataset"
          className="grid gap-4 border-t border-white/10 py-8 text-sm leading-7 text-[var(--text-secondary)] lg:grid-cols-3"
        >
          <div>
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Current source
            </p>
            <p className="mt-3">
              Real ADCC historical match data is the default local dataset.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Explorer route
            </p>
            <p className="mt-3">
              The graph experience now lives separately at{' '}
              <code>/universe</code>.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
              Current scope
            </p>
            <p className="mt-3">
              This phase focuses on structure and usability, not visual-polish
              or force-layout work.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
        {label}
      </p>
      <p className="font-display mt-4 text-4xl text-white">{value}</p>
    </div>
  );
}
