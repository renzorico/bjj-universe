import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sortMode, setSortMode] = useState<AthleteSortMode>('matches');

  const visibleAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedAthletes = [...athletes].sort((left, right) => {
      if (sortMode === 'name') {
        return left.label.localeCompare(right.label);
      }

      const leftTotalMatches = left.displayTotalMatches ?? -1;
      const rightTotalMatches = right.displayTotalMatches ?? -1;

      if (leftTotalMatches !== rightTotalMatches) {
        return rightTotalMatches - leftTotalMatches;
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[320px]">
      <label className="block">
        <span className="sr-only">Search athletes</span>
        <input
          type="search"
          aria-label="Search athletes"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder="Search athletes"
          className="hud-focus h-[33px] w-full rounded-[2px] border border-white/[0.08] bg-transparent px-3 text-[11px] tracking-[0.02em] text-white/90 transition outline-none placeholder:text-[9px] placeholder:tracking-[0.16em] placeholder:uppercase placeholder:text-white/40 [&::placeholder]:[font-family:var(--font-mono)] hover:border-white/[0.14] hover:bg-white/[0.03] focus:border-[rgba(84,219,199,0.22)]"
        />
      </label>

      {(isOpen || query) && (
        <div
          data-testid="athlete-results-panel"
          className="absolute inset-x-0 bottom-[calc(100%+0.35rem)] z-30 rounded-[4px] border border-white/[0.085] bg-[rgba(5,10,18,0.86)] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <p className="text-[8.5px] tracking-[0.18em] text-white/42 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              {visibleAthletes.length} of {athletes.length}
            </p>
            <div className="flex items-center gap-1">
              <SortPill
                active={sortMode === 'matches'}
                label="Sort by matches"
                onClick={() => setSortMode('matches')}
              >
                Matches
              </SortPill>
              <SortPill
                active={sortMode === 'name'}
                label="Sort by name"
                onClick={() => setSortMode('name')}
              >
                A-Z
              </SortPill>
            </div>
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-label="Athlete results"
            className="mt-2 max-h-[min(18rem,calc(100vh-9rem))] overflow-y-auto rounded-[3px] bg-white/[0.02] p-1 sm:max-h-[min(20rem,calc(100vh-10rem))]"
          >
            <div className="space-y-1">
              {visibleAthletes.length === 0 ? (
                <div className="rounded-[3px] border border-dashed border-white/[0.1] px-4 py-6 text-[12px] text-[var(--text-secondary)]">
                  No athletes match the current search.
                </div>
              ) : null}

              {visibleAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  role="option"
                  aria-selected={selectedAthleteId === athlete.id}
                  data-testid={`athlete-list-item-${athlete.id}`}
                  className={`flex w-full items-center justify-between rounded-[3px] border px-3 py-1.5 text-left text-[11.5px] transition ${
                    selectedAthleteId === athlete.id
                      ? 'border-[rgba(84,219,199,0.2)] bg-[rgba(84,219,199,0.07)] text-white'
                      : 'border-transparent text-white/56 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-white/86'
                  }`}
                  onClick={() => {
                    onSelectAthlete(athlete.id);
                    setQuery('');
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-4">{athlete.label}</span>
                  <span className="text-[8.5px] tracking-[0.14em] text-white/38 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                    {athlete.displayTotalMatches === null
                      ? 'Unknown matches'
                      : `${athlete.displayTotalMatches} matches`}
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

function SortPill({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-[16px] min-w-[36px] items-center justify-center rounded-[3px] border px-1 text-[5.5px] leading-none tracking-[0.1em] uppercase transition ${
        active
          ? 'border-[rgba(84,219,199,0.2)] bg-[rgba(84,219,199,0.05)] text-white/72'
          : 'border-white/[0.07] text-white/28 hover:border-white/[0.11] hover:text-white/52'
      }`}
      style={{ fontFamily: 'var(--font-mono)' }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
