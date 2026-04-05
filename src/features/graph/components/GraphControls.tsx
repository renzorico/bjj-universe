import { GraphFilters } from '@/features/graph/lib/types';
import { useMemo, useState } from 'react';

interface GraphControlsProps {
  filters: GraphFilters;
  years: number[];
  sexes: string[];
  weightClasses: string[];
  athletes: Array<{ id: string; label: string }>;
  sourceAthleteId: string | null;
  targetAthleteId: string | null;
  pathStatus: 'idle' | 'selecting_target' | 'found' | 'not_found';
  pathChainLabels: string[];
  onChangePathSource: (athleteId: string | null) => void;
  onChangePathTarget: (athleteId: string | null) => void;
  onClearPath: () => void;
  onChange: (nextFilters: GraphFilters) => void;
}

export function GraphControls({
  filters,
  years,
  sexes,
  weightClasses,
  athletes,
  sourceAthleteId,
  targetAthleteId,
  pathStatus,
  pathChainLabels,
  onChangePathSource,
  onChangePathTarget,
  onClearPath,
  onChange,
}: GraphControlsProps) {
  const [isClosestPathOpen, setIsClosestPathOpen] = useState(false);
  const sortedYears = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years],
  );
  const yearIndex =
    filters.year === null ? 0 : Math.max(0, sortedYears.indexOf(filters.year) + 1);
  const yearProgressPercent =
    sortedYears.length === 0 ? 0 : (yearIndex / sortedYears.length) * 100;

  return (
    <div className="w-full max-w-full space-y-1.5 md:max-w-[20.5rem]">
      <p className="hud-label text-white/26">Filters</p>

      <ControlRow label="Year">
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="hud-label text-white/50">
              {filters.year === null ? 'All years' : filters.year}
            </span>
            {filters.year !== null ? (
              <button
                type="button"
                className="hud-label hud-focus border border-white/[0.08] px-1.5 py-[2px] text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
                onClick={() => onChange({ ...filters, year: null })}
              >
                All years
              </button>
            ) : null}
          </div>

          <input
            type="range"
            aria-label="Year filter"
            min={0}
            max={sortedYears.length}
            step={1}
            value={yearIndex}
            className="year-slider hud-focus w-full"
            style={{ '--year-slider-progress': `${yearProgressPercent}%` } as React.CSSProperties}
            onChange={(e) => {
              const nextIndex = Number(e.target.value);
              const nextYear = nextIndex === 0 ? null : sortedYears[nextIndex - 1] ?? null;
              onChange({
                ...filters,
                year: nextYear,
              });
            }}
          />

          <div className="flex items-center justify-between text-[8px] tracking-[0.14em] text-white/24 uppercase [font-family:var(--font-mono)]">
            <span>All</span>
            <span>{sortedYears[0] ?? '—'}</span>
            <span>{sortedYears[sortedYears.length - 1] ?? '—'}</span>
          </div>
        </div>
      </ControlRow>

      <ControlRow label="Division">
        <Cluster fullWidth>
          <Segment
            active={filters.sex === null}
            grow
            onClick={() =>
              onChange({ ...filters, sex: null, weightClass: null })
            }
          >
            All
          </Segment>
          {sexes.map((sex) => (
            <Segment
              key={sex}
              active={filters.sex === sex}
              grow
              onClick={() => onChange({ ...filters, sex, weightClass: null })}
            >
              {formatSexLabel(sex)}
            </Segment>
          ))}
        </Cluster>
      </ControlRow>

      <ControlRow label="Weight">
        <select
          aria-label="Weight class filter"
          value={filters.weightClass ?? ''}
          className={clusterSelectClass}
          style={{ fontFamily: 'var(--font-mono)' }}
          onChange={(e) =>
            onChange({
              ...filters,
              weightClass: e.target.value || null,
            })
          }
        >
          <option value="">All weights</option>
          {weightClasses.map((wc) => (
            <option key={wc} value={wc}>
              {formatWeightLabel(wc)}
            </option>
          ))}
        </select>
      </ControlRow>

      <ControlRow label="Mode">
        <Cluster fullWidth>
          {(['all', 'rivalry', 'era'] as const).map((mode) => (
            <Segment
              key={mode}
              active={filters.displayMode === mode}
              grow
              onClick={() => onChange({ ...filters, displayMode: mode })}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Segment>
          ))}
        </Cluster>
      </ControlRow>

      <ControlRow label="Closest path">
        <div className="w-full space-y-1.5">
          <button
            type="button"
            aria-expanded={isClosestPathOpen}
            aria-controls="closest-path-panel"
            className="hud-label hud-focus flex w-full items-center justify-between rounded-[2px] border border-white/[0.08] px-2 py-1 text-white/42 transition hover:border-white/[0.14] hover:text-white/68"
            onClick={() => setIsClosestPathOpen((current) => !current)}
          >
            <span>{isClosestPathOpen ? 'Hide' : 'Show'}</span>
            <span>{isClosestPathOpen ? '−' : '+'}</span>
          </button>

          {isClosestPathOpen ? (
            <div id="closest-path-panel" className="space-y-1.5">
              <select
                aria-label="Path source athlete"
                value={sourceAthleteId ?? ''}
                className={clusterSelectClass}
                style={{ fontFamily: 'var(--font-mono)' }}
                onChange={(event) => onChangePathSource(event.target.value || null)}
              >
                <option value="">Athlete A</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Path target athlete"
                value={targetAthleteId ?? ''}
                className={clusterSelectClass}
                style={{ fontFamily: 'var(--font-mono)' }}
                onChange={(event) => onChangePathTarget(event.target.value || null)}
              >
                <option value="">Athlete B</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between gap-2">
                <span className="hud-label text-white/38">
                  {formatPathStatusLabel(pathStatus)}
                </span>
                <button
                  type="button"
                  className="hud-label hud-focus border border-white/[0.08] px-1.5 py-[2px] text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
                  onClick={onClearPath}
                >
                  Clear path
                </button>
              </div>

              {pathStatus === 'not_found' ? (
                <p className="text-[9px] leading-[1.45] text-white/44 [font-family:var(--font-mono)]">
                  No path found in current graph.
                </p>
              ) : null}

              {pathChainLabels.length > 0 ? (
                <p className="text-[9px] leading-[1.55] text-white/50 [font-family:var(--font-mono)]">
                  {pathChainLabels.join(' -> ')}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </ControlRow>
    </div>
  );
}

function formatPathStatusLabel(
  status: 'idle' | 'selecting_target' | 'found' | 'not_found',
) {
  if (status === 'selecting_target') return 'Pick athlete B';
  if (status === 'found') return 'Path ready';
  if (status === 'not_found') return 'No path found';
  return 'Pick athletes A and B';
}

function ControlRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-1.5 border-b border-white/[0.05] py-1.5 last:border-b-0 sm:grid-cols-[5.2rem_minmax(0,1fr)] sm:gap-2">
      <p className="hud-label pt-[3px] text-white/24 sm:pt-[3px]">{label}</p>
      {children}
    </div>
  );
}

function Cluster({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`inline-flex min-h-[24px] flex-wrap items-center gap-px rounded-[3px] border border-white/[0.05] bg-white/[0.012] p-[1px] ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </div>
  );
}

function Segment({
  active,
  children,
  grow = false,
  onClick,
}: {
  active: boolean;
  children: string;
  grow?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`hud-label hud-focus flex h-[28px] items-center rounded-[2px] border px-2 transition-[color,border-color,background-color] duration-150 sm:h-[20px] ${grow ? 'flex-1 justify-center' : ''} ${
        active
          ? 'border-[color:var(--border-accent)] bg-[rgba(84,219,199,0.07)] font-medium text-white'
          : 'border-transparent text-white/42 hover:border-white/[0.06] hover:bg-white/[0.028] hover:text-white/76 focus-visible:border-[color:var(--border-accent)] focus-visible:text-white'
      }`}
      style={{ fontFamily: 'var(--font-mono)' }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatSexLabel(sex: string) {
  if (sex === 'M') return 'Men';
  if (sex === 'F') return 'Women';
  return sex;
}

function formatWeightLabel(weightClass: string) {
  if (weightClass === '60KG') return '-60KG';
  return weightClass;
}

const clusterSelectClass =
  'hud-label hud-focus hud-select h-[30px] w-full appearance-none rounded-[3px] border border-white/[0.05] bg-white/[0.014] px-2.5 pr-7 text-left text-white/48 transition-[color,border-color,background-color] duration-150 cursor-pointer hover:border-white/[0.08] hover:bg-white/[0.024] hover:text-white/78 focus-visible:border-[color:var(--border-accent)] focus-visible:bg-white/[0.02] focus-visible:text-white sm:h-[22px]';
