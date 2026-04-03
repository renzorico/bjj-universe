import { GraphFilters } from '@/features/graph/lib/types';

interface GraphControlsProps {
  filters: GraphFilters;
  years: number[];
  divisions: string[];
  onChange: (nextFilters: GraphFilters) => void;
}

export function GraphControls({
  filters,
  years,
  divisions,
  onChange,
}: GraphControlsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
      <label className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
        <span className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Year
        </span>
        <select
          aria-label="Year filter"
          className="mt-2 w-full bg-transparent text-sm text-white outline-none"
          value={filters.year ?? 'all'}
          onChange={(event) =>
            onChange({
              ...filters,
              year:
                event.target.value === 'all'
                  ? null
                  : Number(event.target.value),
            })
          }
        >
          <option value="all">All years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
        <span className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Division
        </span>
        <select
          aria-label="Division filter"
          className="mt-2 w-full bg-transparent text-sm text-white outline-none"
          value={filters.division ?? 'all'}
          onChange={(event) =>
            onChange({
              ...filters,
              division:
                event.target.value === 'all' ? null : event.target.value,
            })
          }
        >
          <option value="all">All divisions</option>
          {divisions.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Display mode
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <DisplayModeButton
            active={filters.displayMode === 'all'}
            onClick={() => onChange({ ...filters, displayMode: 'all' })}
          >
            All observed matches
          </DisplayModeButton>
          <DisplayModeButton
            active={filters.displayMode === 'rivalry'}
            onClick={() => onChange({ ...filters, displayMode: 'rivalry' })}
          >
            Rivalry intensity
          </DisplayModeButton>
          <DisplayModeButton
            active={filters.displayMode === 'era'}
            onClick={() => onChange({ ...filters, displayMode: 'era' })}
          >
            Era emphasis
          </DisplayModeButton>
        </div>
      </div>
    </div>
  );
}

function DisplayModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? 'bg-[var(--accent)] text-[#05101d]'
          : 'border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
