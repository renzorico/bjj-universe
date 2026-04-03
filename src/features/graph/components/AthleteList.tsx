import { useMemo, useState } from 'react';
import { SceneNodeViewModel } from '@/features/graph/lib/types';

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
  const visibleAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedAthletes = [...athletes].sort((left, right) => {
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
  }, [athletes, query]);

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Athlete browser
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Searchable fallback for touch and tests
        </p>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Search athletes</span>
        <input
          type="search"
          aria-label="Search athletes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search athletes"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white transition outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
        />
      </label>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <p>
          Showing {visibleAthletes.length} of {athletes.length}
        </p>
        {query ? (
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-[var(--text-secondary)] transition hover:bg-white/8"
            onClick={() => setQuery('')}
          >
            Clear search
          </button>
        ) : null}
      </div>

      <div className="mt-4 max-h-[340px] overflow-y-auto rounded-[20px] border border-white/8 bg-black/10 p-2">
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
              onClick={() => onSelectAthlete(athlete.id)}
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
  );
}
