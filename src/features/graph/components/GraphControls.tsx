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
  const isAllYears = filters.year === null;
  const activeYear = filters.year ?? maxYear;

  return (
    <div className="grid gap-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(140px,0.72fr)_minmax(160px,0.8fr)_minmax(190px,0.9fr)]">
      <div className="rounded-[16px] border border-white/8 bg-black/32 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
            Year
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isAllYears ? 'text-[var(--text-secondary)]' : 'text-white'}`}
            >
              {isAllYears ? 'All years' : activeYear}
            </span>
            <button
              type="button"
              className={`h-8 rounded-full border px-3 text-[10px] tracking-[0.18em] uppercase transition ${
                isAllYears
                  ? 'border-[var(--accent)] bg-[rgba(122,162,255,0.18)] text-white'
                  : 'border-white/10 bg-black/35 text-[var(--text-secondary)] hover:bg-black/50'
              }`}
              onClick={() =>
                onChange({
                  ...filters,
                  year: null,
                })
              }
            >
              All years
            </button>
          </div>
        </div>

        <div className="mt-3">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            aria-label="Year filter"
            value={activeYear}
            onChange={(event) =>
              onChange({
                ...filters,
                year: Number(event.target.value),
              })
            }
            className={`year-slider w-full ${isAllYears ? 'opacity-45' : 'opacity-100'}`}
          />
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>{minYear}</span>
            <span>{maxYear}</span>
          </div>
        </div>
      </div>

      <label className="rounded-[16px] border border-white/8 bg-black/32 px-4 py-3 backdrop-blur-xl">
        <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
          Sex
        </span>
        <select
          aria-label="Sex filter"
          className="mt-2 h-8 w-full appearance-none bg-transparent text-sm text-white outline-none"
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

      <label className="rounded-[16px] border border-white/8 bg-black/32 px-4 py-3 backdrop-blur-xl">
        <span className="text-[11px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
          Weight
        </span>
        <select
          aria-label="Weight class filter"
          className="mt-2 h-8 w-full appearance-none bg-transparent text-sm text-white outline-none"
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

      <div className="rounded-[16px] border border-white/8 bg-black/32 px-4 py-3 backdrop-blur-xl">
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
      className={`h-8 rounded-full px-3 text-[10px] tracking-[0.16em] uppercase transition ${
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
