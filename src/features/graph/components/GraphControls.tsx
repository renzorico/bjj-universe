import { GraphFilters } from '@/features/graph/lib/types';

interface GraphControlsProps {
  filters: GraphFilters;
  years: number[];
  sexes: string[];
  weightClasses: string[];
  onChange: (nextFilters: GraphFilters) => void;
}

export function GraphControls({
  filters,
  years,
  sexes,
  weightClasses,
  onChange,
}: GraphControlsProps) {
  const minYear = years[0] ?? 1998;
  const maxYear = years[years.length - 1] ?? minYear;
  const isAllYears =
    filters.yearRange.start === minYear && filters.yearRange.end === maxYear;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)_minmax(170px,0.9fr)_minmax(200px,1fr)]">
        <div className="rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Year range
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">
                {formatYearRange(filters.yearRange, isAllYears)}
              </span>
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase transition ${
                  isAllYears
                    ? 'border-[var(--accent)] bg-[rgba(122,162,255,0.18)] text-white'
                    : 'border-white/10 bg-black/35 text-[var(--text-secondary)] hover:bg-black/50'
                }`}
                onClick={() =>
                  onChange({
                    ...filters,
                    yearRange: { start: minYear, end: maxYear },
                  })
                }
              >
                All years
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            <input
              type="range"
              min={minYear}
              max={maxYear}
              step={1}
              aria-label="Year range start"
              value={filters.yearRange.start}
              onChange={(event) => {
                const nextStart = Math.min(
                  Number(event.target.value),
                  filters.yearRange.end,
                );

                onChange({
                  ...filters,
                  yearRange: {
                    start: nextStart,
                    end: filters.yearRange.end,
                  },
                });
              }}
              className="w-full accent-[var(--accent)]"
            />

            <input
              type="range"
              min={minYear}
              max={maxYear}
              step={1}
              aria-label="Year range end"
              value={filters.yearRange.end}
              onChange={(event) => {
                const nextEnd = Math.max(
                  Number(event.target.value),
                  filters.yearRange.start,
                );

                onChange({
                  ...filters,
                  yearRange: {
                    start: filters.yearRange.start,
                    end: nextEnd,
                  },
                });
              }}
              className="w-full accent-[var(--accent-soft)]"
            />
          </div>
        </div>

        <label className="rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
          <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
            Sex
          </span>
          <select
            aria-label="Sex filter"
            className="mt-2 w-full appearance-none bg-transparent text-sm text-white outline-none"
            value={filters.sex ?? 'all'}
            onChange={(event) =>
              onChange({
                ...filters,
                sex: event.target.value === 'all' ? null : event.target.value,
                weightClass: null,
              })
            }
          >
            <option value="all">All</option>
            {sexes.map((sex) => (
              <option key={sex} value={sex}>
                {formatSexLabel(sex)}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
          <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
            Weight
          </span>
          <select
            aria-label="Weight class filter"
            className="mt-2 w-full appearance-none bg-transparent text-sm text-white outline-none"
            value={filters.weightClass ?? 'all'}
            onChange={(event) =>
              onChange({
                ...filters,
                weightClass:
                  event.target.value === 'all' ? null : event.target.value,
              })
            }
          >
            <option value="all">All weights</option>
            {weightClasses.map((weightClass) => (
              <option key={weightClass} value={weightClass}>
                {weightClass}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
          <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
            Mode
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DisplayModeButton
              active={filters.displayMode === 'all'}
              onClick={() => onChange({ ...filters, displayMode: 'all' })}
            >
              All
            </DisplayModeButton>
            <DisplayModeButton
              active={filters.displayMode === 'rivalry'}
              onClick={() => onChange({ ...filters, displayMode: 'rivalry' })}
            >
              Rivalry
            </DisplayModeButton>
            <DisplayModeButton
              active={filters.displayMode === 'era'}
              onClick={() => onChange({ ...filters, displayMode: 'era' })}
            >
              Era
            </DisplayModeButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatYearRange(
  yearRange: GraphFilters['yearRange'],
  isAllYears: boolean,
) {
  if (isAllYears) {
    return 'All years';
  }

  if (yearRange.start === yearRange.end) {
    return `${yearRange.start}`;
  }

  return `${yearRange.start}\u2013${yearRange.end}`;
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
      className={`rounded-full px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition ${
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
