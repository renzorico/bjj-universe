import { type ReactNode, useState } from 'react';
import { GraphAthleteDetail } from '@/features/graph/lib/types';

interface AthleteDetailPanelProps {
  detail: GraphAthleteDetail | null;
  compareAId: string | null;
  compareBId: string | null;
  onPinCompareA: (athleteId: string) => void;
  onPinCompareB: (athleteId: string) => void;
  onClearSelection: () => void;
}

const COUNTRY_TO_ISO2: Record<string, string> = {
  argentina: 'AR',
  australia: 'AU',
  brazil: 'BR',
  canada: 'CA',
  chile: 'CL',
  colombia: 'CO',
  denmark: 'DK',
  england: 'GB',
  france: 'FR',
  germany: 'DE',
  ireland: 'IE',
  italy: 'IT',
  japan: 'JP',
  mexico: 'MX',
  netherlands: 'NL',
  'new zealand': 'NZ',
  norway: 'NO',
  peru: 'PE',
  poland: 'PL',
  portugal: 'PT',
  russia: 'RU',
  'south korea': 'KR',
  spain: 'ES',
  sweden: 'SE',
  uae: 'AE',
  uk: 'GB',
  ukraine: 'UA',
  'united arab emirates': 'AE',
  'united kingdom': 'GB',
  'united states': 'US',
  usa: 'US',
  us: 'US',
  venezuela: 'VE',
};

export function AthleteDetailPanel({
  detail,
  compareAId,
  compareBId,
  onPinCompareA,
  onPinCompareB,
  onClearSelection,
}: AthleteDetailPanelProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const shellClassName =
    'hud-panel rounded-[3px] border-white/[0.07] bg-[rgba(4,9,17,0.8)] shadow-[0_12px_30px_rgba(0,0,0,0.3)]';

  if (!detail) {
    return (
      <aside className={shellClassName}>
        <div className="border-b border-white/[0.05] px-4 py-3">
          <p className="hud-label text-white/24">
            Athlete detail
          </p>
          <h3 className="font-display mt-1 text-[1.1rem] font-bold tracking-[0.03em] text-white/60 uppercase">
            Select an athlete
          </h3>
        </div>
        <p className="hud-dim px-4 py-3 text-white/36">
          Click a node in the graph or use the search to inspect a
          competitor&apos;s profile.
        </p>
      </aside>
    );
  }

  const { athlete, relatedMatches } = detail;
  const isPinnedA = compareAId === athlete.id;
  const isPinnedB = compareBId === athlete.id;

  return (
    <aside
      data-testid="athlete-detail-panel"
      className={shellClassName}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] px-4 py-3">
        <div className="min-w-0">
          <p className="hud-label text-white/24">
            Selected
          </p>
          <h3 className="font-display mt-1 text-[1.5rem] font-bold leading-[0.95] tracking-[0.02em] text-white">
            {athlete.label}
          </h3>
          {isPinnedA || isPinnedB ? (
            <p className="mt-1 text-[8px] tracking-[0.18em] text-white/34 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              {isPinnedA && isPinnedB
                ? 'Pinned as Compare A and B'
                : isPinnedA
                  ? 'Pinned as Compare A'
                  : 'Pinned as Compare B'}
            </p>
          ) : null}
        </div>
        <div className="mt-0.5 flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-1.5 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
              onClick={() => onPinCompareA(athlete.id)}
            >
              {isPinnedA ? 'Pinned A' : 'Pin A'}
            </button>
            <button
              type="button"
              className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-1.5 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/62"
              onClick={() => onPinCompareB(athlete.id)}
            >
              {isPinnedB ? 'Pinned B' : 'Pin B'}
            </button>
          </div>
          <button
            type="button"
            className="hud-label hud-focus rounded-[2px] border border-white/[0.08] px-2 py-0.5 text-white/34 transition hover:border-white/[0.14] hover:text-white/64"
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal data rows */}
      <div className="divide-y divide-white/[0.05] border-b border-white/[0.05]">
        <DataRow label="Academy" value={athlete.team ?? 'Independent'} />
        <DataRow
          label="Nationality"
          value={formatNationalityWithFlag(athlete.nationality)}
        />
        <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
          <DataRow label="Matches" value={athlete.displayTotalMatches?.toString() ?? '—'} inline />
          <DataRow label="Wins" value={athlete.wins.toString()} inline />
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
          <DataRow
            label="Active"
            value={formatYearRange(
              athlete.displayActiveYearFirst,
              athlete.displayActiveYearLast,
            )}
            inline
          />
          <DataRow
            label="Bridge"
            value={athlete.bridgeScore.toString()}
            inline
          />
        </div>
        <DataRow
          label="Weight class"
          value={athlete.displayPrimaryWeightClass ?? '—'}
        />
      </div>

      {/* Match history log */}
      <div>
        <button
          type="button"
          aria-expanded={historyOpen}
          className="hud-focus flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/[0.02]"
          onClick={() => setHistoryOpen((current) => !current)}
        >
          <span className="hud-label text-white/34">
            Match log · {relatedMatches.length} in view
          </span>
          <span className="hud-label text-white/24">
            {historyOpen ? 'Hide' : 'Show'}
          </span>
        </button>

        {historyOpen ? (
          <ul className="max-h-[14rem] divide-y divide-white/[0.045] overflow-y-auto border-t border-white/[0.05]">
            {relatedMatches.map((match) => (
              <li key={match.id} className="px-4 py-2 transition hover:bg-white/[0.018]">
                <p className="text-[11px] font-medium text-white/82">
                  {match.resultLabel} {match.opponentLabel}
                </p>
                <p className="mt-0.5 text-[10px] tracking-[0.08em] text-white/34" style={{ fontFamily: 'var(--font-mono)' }}>
                  {match.eventName} · {match.year} ·{' '}
                  {formatMatchDivision(match.sex, match.weightClass)}
                </p>
                <p className="mt-0.5 text-[8.5px] tracking-[0.18em] text-white/22 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                  {match.roundLabel ?? 'Bout'} · {match.method ?? 'Decision'}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

function DataRow({
  label,
  value,
  inline = false,
}: {
  label: string;
  value: ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={`px-4 ${inline ? 'py-1.5' : 'py-2'}`}>
      <dt className="hud-label text-white/24">
        {label}
      </dt>
      <dd className="hud-value mt-0.5 text-white/80">{value}</dd>
    </div>
  );
}

function formatSexLabel(sex: string) {
  if (sex === 'M') return 'Men';
  if (sex === 'F') return 'Women';
  return sex;
}

function formatNationalityWithFlag(nationality?: string | null): ReactNode {
  const text = nationality?.trim();
  if (!text) {
    return '—';
  }

  const isoCode = getIso2CountryCode(text);
  if (!isoCode) {
    return text;
  }

  const flag = iso2ToFlagEmoji(isoCode);
  if (!flag) {
    return text;
  }

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span>{text}</span>
      <span className="text-[0.78em] leading-none" aria-hidden="true">
        {flag}
      </span>
    </span>
  );
}

function getIso2CountryCode(countryText: string): string | null {
  const normalized = countryText
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  if (COUNTRY_TO_ISO2[normalized]) {
    return COUNTRY_TO_ISO2[normalized];
  }

  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return null;
}

function iso2ToFlagEmoji(isoCode: string): string | null {
  const normalized = isoCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return null;
  }

  const regionalIndicatorOffset = 127397;
  return String.fromCodePoint(
    ...normalized
      .split('')
      .map((char) => regionalIndicatorOffset + char.charCodeAt(0)),
  );
}

function formatMatchDivision(sex?: string, weightClass?: string) {
  if (sex && weightClass) return `${formatSexLabel(sex)} · ${weightClass}`;
  return weightClass ?? sex ?? 'Unknown';
}

function formatYearRange(
  startYear: number | null,
  endYear: number | null,
) {
  if (startYear === null || endYear === null) return '—';
  return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
}
