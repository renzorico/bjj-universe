import { useMemo, useState } from 'react';
import { SceneNodeViewModel } from '@/features/graph/lib/types';

type AthleteSortMode = 'matches' | 'name';

interface AthleteListProps {
  athletes: SceneNodeViewModel[];
  selectedAthleteId: string | null;
  onSelectAthlete: (athleteId: string) => void;
}

export function AthleteList({
  athletes,
  selectedAthleteId,
  onSelectAthlete,
}: AthleteListProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sortMode, setSortMode] = useState<AthleteSortMode>('matches');

  const visibleAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedAthletes = [...athletes].sort((left, right) => {
      if (sortMode === 'name') {
        return left.label.localeCompare(right.label);
      }

      if (left.activeMatches !== right.activeMatches) {
        return right.activeMatches - left.activeMatches;
      }

      return left.label.localeCompare(right.label);
    });

    if (!normalizedQuery) {
      return sortedAthletes;
    }

    return sortedAthletes.filter((athlete) =>
      athlete.label.toLowerCase().includes(normalizedQuery),
    );
  }, [athletes, query, sortMode]);

  return (
    <div className="relative w-full max-w-[360px]">
      <label className="block">
        <span className="sr-only">Search athletes</span>
        <input
          type="search"
          aria-label="Search athletes"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search athletes"
          className="w-full rounded-[22px] border border-white/10 bg-black/50 px-4 py-3 text-sm text-white shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
        />
      </label>

      {(isOpen || query) && (
        <div className="absolute top-[calc(100%+0.75rem)] right-0 left-0 z-30 rounded-[24px] border border-white/10 bg-[rgba(5,10,18,0.92)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <p className="text-xs tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Athlete browser
            </p>
            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] tracking-[0.14em] text-[var(--text-secondary)] uppercase transition hover:bg-white/8"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 px-2">
            <p className="text-xs text-[var(--text-secondary)]">
              {visibleAthletes.length} of {athletes.length}
            </p>
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Sort</span>
              <select
                aria-label="Athlete sort"
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as AthleteSortMode)
                }
              >
                <option value="matches">Matches</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          <div className="mt-3 max-h-[320px] overflow-y-auto rounded-[20px] border border-white/8 bg-black/25 p-2">
            <div className="space-y-1">
              {visibleAthletes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-[var(--text-secondary)]">
                  No athletes match the current search.
                </div>
              ) : null}

              {visibleAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  data-testid={`athlete-list-item-${athlete.id}`}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedAthleteId === athlete.id
                      ? 'border-[var(--accent)] bg-[rgba(122,162,255,0.16)] text-white'
                      : 'border-white/8 bg-white/4 text-[var(--text-secondary)] hover:bg-white/8'
                  }`}
                  onClick={() => {
                    onSelectAthlete(athlete.id);
                    setQuery('');
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-4">{athlete.label}</span>
                  <span className="text-xs tracking-[0.16em] text-[var(--text-muted)] uppercase">
                    {athlete.activeMatches} matches
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
