import { GraphAthleteDetail } from '@/features/graph/lib/types';

interface AthleteDetailPanelProps {
  detail: GraphAthleteDetail | null;
  onClearSelection: () => void;
}

export function AthleteDetailPanel({
  detail,
  onClearSelection,
}: AthleteDetailPanelProps) {
  if (!detail) {
    return (
      <aside className="rounded-[24px] border border-white/8 bg-[rgba(5,10,18,0.78)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl xl:h-full">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Athlete detail
        </p>
        <h3 className="font-display mt-4 text-2xl text-white">
          Select an athlete
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Click a node in the graph or use the athlete list below to inspect a
          competitor&apos;s profile and current filtered match history.
        </p>
      </aside>
    );
  }

  const { athlete, relatedMatches } = detail;

  return (
    <aside
      data-testid="athlete-detail-panel"
      className="rounded-[24px] border border-white/8 bg-[rgba(5,10,18,0.8)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl xl:h-full xl:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
            Athlete detail
          </p>
          <h3 className="font-display mt-3 text-3xl text-white">
            {athlete.label}
          </h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {athlete.team ?? 'Independent'} ·{' '}
            {athlete.nationality ?? 'Unknown nationality'}
          </p>
        </div>
        <button
          type="button"
          className="h-9 rounded-full border border-white/10 px-3 text-xs tracking-[0.18em] text-[var(--text-secondary)] uppercase"
          onClick={onClearSelection}
        >
          Clear
        </button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Wins" value={athlete.wins.toString()} />
        <StatCard label="Losses" value={athlete.losses.toString()} />
        <StatCard label="Bridge score" value={athlete.bridgeScore.toString()} />
        <StatCard label="Active years" value={athlete.yearsActive.join(', ')} />
      </dl>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
            Sex
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {athlete.sexes.map((sex) => (
              <span
                key={sex}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                {formatSexLabel(sex)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
            Weight classes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {athlete.weightClasses.map((weightClass) => (
              <span
                key={weightClass}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                {weightClass}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Filtered match history
        </p>
        <ul className="mt-4 space-y-3">
          {relatedMatches.map((match) => {
            return (
              <li
                key={match.id}
                className="rounded-[20px] border border-white/10 bg-white/4 p-4"
              >
                <p className="text-sm font-medium text-white">
                  {match.resultLabel} {match.opponentLabel}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {match.eventName} · {match.year} ·{' '}
                  {formatMatchDivision(match.sex, match.weightClass)}
                </p>
                <p className="mt-1 text-xs tracking-[0.18em] text-[var(--text-muted)] uppercase">
                  {match.roundLabel ?? 'Bout'} · {match.method ?? 'Decision'}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function formatSexLabel(sex: string) {
  if (sex === 'M') {
    return 'Men';
  }

  if (sex === 'F') {
    return 'Women';
  }

  return sex;
}

function formatMatchDivision(sex?: string, weightClass?: string) {
  if (sex && weightClass) {
    return `${formatSexLabel(sex)} · ${weightClass}`;
  }

  return weightClass ?? sex ?? 'Unknown class';
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/4 p-4">
      <dt className="text-xs tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-white">{value}</dd>
    </div>
  );
}
