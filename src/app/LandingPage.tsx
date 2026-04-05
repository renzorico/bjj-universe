import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import logoUrl from '../../data/logo.png';
import { AppRoute } from '@/app/useAppRoute';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
  snapshot: UniverseSnapshot;
}

interface MetricBubble {
  label: string;
  value: string;
  top: string;
  left: string;
  size: number;
  tier: 'large' | 'medium' | 'small';
  accent: string;
  glowColor: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
  driftX: string;
  driftY: string;
  driftDuration: number;
  pulseDuration: number;
}

const ENTRY_THRESHOLD = 0.88;
const ENTRY_HANDLE_SIZE = 48;

export function LandingPage({ onNavigate, snapshot }: LandingPageProps) {
  const [entryProgress, setEntryProgress] = useState(0);
  const [isEntryDragging, setIsEntryDragging] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const entryTrackRef = useRef<HTMLDivElement | null>(null);
  const entryProgressRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);
  const didNavigateRef = useRef(false);

  const countryCount = new Set(
    snapshot.nodes.map((node) => node.nationality).filter(Boolean),
  ).size;
  const teamCount = new Set(
    snapshot.nodes.map((node) => node.team).filter(Boolean),
  ).size;
  const averageMatchesPerAthlete = Math.round(
    snapshot.summary.matchCount / Math.max(1, snapshot.summary.athleteCount),
  );

  // Size hierarchy: Athletes and Matches are dominant hubs, others are satellites
  const bubbleMetrics: MetricBubble[] = [
    // Index 0: Athletes — dominant hub
    {
      label: 'Athletes',
      value: snapshot.summary.athleteCount.toString(),
      top: '33%',
      left: '66%',
      size: 258,
      tier: 'large',
      accent: 'rgba(201, 45, 40, 0.44)',
      glowColor: 'rgba(201, 45, 40, 0.58)',
      borderColor: 'rgba(214, 86, 77, 0.52)',
      labelColor: 'rgba(255, 246, 244, 0.96)',
      valueColor: 'rgba(255, 252, 250, 0.99)',
      driftX: '36px',
      driftY: '-44px',
      driftDuration: 16,
      pulseDuration: 9,
    },
    // Index 1: Matches — second hub
    {
      label: 'Matches',
      value: snapshot.summary.matchCount.toString(),
      top: '55%',
      left: '82%',
      size: 228,
      tier: 'large',
      accent: 'rgba(232, 223, 208, 0.22)',
      glowColor: 'rgba(232, 223, 208, 0.28)',
      borderColor: 'rgba(238, 229, 218, 0.38)',
      labelColor: 'rgba(252, 248, 244, 0.96)',
      valueColor: 'rgba(255, 252, 249, 0.99)',
      driftX: '-42px',
      driftY: '30px',
      driftDuration: 19,
      pulseDuration: 11,
    },
    // Index 2: Events — satellite
    {
      label: 'Events',
      value: snapshot.summary.eventCount.toString(),
      top: '76%',
      left: '60%',
      size: 132,
      tier: 'medium',
      accent: 'rgba(210, 171, 115, 0.24)',
      glowColor: 'rgba(210, 171, 115, 0.32)',
      borderColor: 'rgba(219, 185, 137, 0.38)',
      labelColor: 'rgba(252, 244, 228, 0.96)',
      valueColor: 'rgba(254, 248, 236, 0.99)',
      driftX: '36px',
      driftY: '28px',
      driftDuration: 17,
      pulseDuration: 11,
    },
    // Index 3: Countries
    {
      label: 'Countries',
      value: countryCount.toString(),
      top: '16%',
      left: '88%',
      size: 150,
      tier: 'medium',
      accent: 'rgba(178, 162, 148, 0.2)',
      glowColor: 'rgba(178, 162, 148, 0.3)',
      borderColor: 'rgba(195, 180, 166, 0.36)',
      labelColor: 'rgba(250, 245, 240, 0.96)',
      valueColor: 'rgba(254, 250, 246, 0.99)',
      driftX: '-26px',
      driftY: '-38px',
      driftDuration: 14,
      pulseDuration: 10,
    },
    // Index 4: Teams
    {
      label: 'Teams',
      value: teamCount.toString(),
      top: '74%',
      left: '90%',
      size: 148,
      tier: 'medium',
      accent: 'rgba(158, 45, 40, 0.38)',
      glowColor: 'rgba(158, 45, 40, 0.54)',
      borderColor: 'rgba(184, 78, 70, 0.44)',
      labelColor: 'rgba(252, 234, 230, 0.96)',
      valueColor: 'rgba(254, 243, 240, 0.99)',
      driftX: '-32px',
      driftY: '40px',
      driftDuration: 18,
      pulseDuration: 12,
    },
    // Index 5: Avg bouts — smallest satellite
    {
      label: 'Avg bouts',
      value: averageMatchesPerAthlete.toString(),
      top: '48%',
      left: '55%',
      size: 122,
      tier: 'small',
      accent: 'rgba(232, 223, 208, 0.18)',
      glowColor: 'rgba(232, 223, 208, 0.28)',
      borderColor: 'rgba(236, 226, 214, 0.34)',
      labelColor: 'rgba(250, 245, 238, 0.96)',
      valueColor: 'rgba(254, 249, 243, 0.99)',
      driftX: '22px',
      driftY: '-26px',
      driftDuration: 13,
      pulseDuration: 8,
    },
    // Index 6: Submission % — computed from canonical match data
    {
      label: 'Sub Rate',
      value: `${snapshot.summary.submissionRate}%`,
      top: '22%',
      left: '75%',
      size: 138,
      tier: 'medium',
      accent: 'rgba(201, 45, 40, 0.36)',
      glowColor: 'rgba(201, 45, 40, 0.52)',
      borderColor: 'rgba(214, 86, 77, 0.44)',
      labelColor: 'rgba(255, 246, 244, 0.96)',
      valueColor: 'rgba(255, 252, 250, 0.99)',
      driftX: '-24px',
      driftY: '-32px',
      driftDuration: 15,
      pulseDuration: 10,
    },
  ];

  const tierMotion = {
    large: { driftFactor: 1, pulseFactor: 1, driftScale: '1.022' },
    medium: { driftFactor: 0.94, pulseFactor: 0.94, driftScale: '1.03' },
    small: { driftFactor: 0.88, pulseFactor: 0.86, driftScale: '1.036' },
  } as const;

  const connections: [number, number][] = [
    [0, 1],
    [0, 6],
    [6, 1],
    [1, 2],
    [1, 4],
    [0, 5],
    [6, 3],
    [3, 1],
  ];

  useEffect(() => {
    entryProgressRef.current = entryProgress;
  }, [entryProgress]);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current !== null) {
        window.clearTimeout(enterTimeoutRef.current);
      }
    };
  }, []);

  const resolveProgressFromClientX = useCallback((clientX: number) => {
    const track = entryTrackRef.current;
    if (!track) {
      return 0;
    }

    const bounds = track.getBoundingClientRect();
    const maxTravel = Math.max(1, bounds.width - ENTRY_HANDLE_SIZE);
    const next = (clientX - bounds.left - ENTRY_HANDLE_SIZE / 2) / maxTravel;

    return Math.min(1, Math.max(0, next));
  }, []);

  const triggerUniverseEntry = useCallback(() => {
    if (didNavigateRef.current) {
      return;
    }

    didNavigateRef.current = true;
    setIsEntering(true);
    setEntryProgress(1);

    enterTimeoutRef.current = window.setTimeout(() => {
      onNavigate('/universe');
    }, 170);
  }, [onNavigate]);

  const resetEntryControl = useCallback(() => {
    setIsEntryDragging(false);
    setEntryProgress(0);
    activePointerIdRef.current = null;
  }, []);

  const handleEntryPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isEntering) {
        return;
      }

      event.preventDefault();
      activePointerIdRef.current = event.pointerId;
      setIsEntryDragging(true);
      setEntryProgress(resolveProgressFromClientX(event.clientX));
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isEntering, resolveProgressFromClientX],
  );

  const handleEntryPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isEntryDragging || activePointerIdRef.current !== event.pointerId) {
        return;
      }

      setEntryProgress(resolveProgressFromClientX(event.clientX));
    },
    [isEntryDragging, resolveProgressFromClientX],
  );

  const handleEntryPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isEntryDragging || activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const releasedProgress = resolveProgressFromClientX(event.clientX);
      setEntryProgress(releasedProgress);
      setIsEntryDragging(false);
      activePointerIdRef.current = null;

      if (releasedProgress >= ENTRY_THRESHOLD) {
        triggerUniverseEntry();
        return;
      }

      setEntryProgress(0);
    },
    [isEntryDragging, resolveProgressFromClientX, triggerUniverseEntry],
  );

  const handleEntryKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEntering) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setEntryProgress((prev) => Math.min(1, prev + 0.12));
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setEntryProgress((prev) => Math.max(0, prev - 0.12));
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setEntryProgress(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        triggerUniverseEntry();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (entryProgressRef.current >= ENTRY_THRESHOLD) {
          triggerUniverseEntry();
          return;
        }

        setEntryProgress(0);
      }
    },
    [isEntering, triggerUniverseEntry],
  );

  return (
    <div className="page-reveal relative h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">

      {/* Unified space backdrop shared with Universe screen */}
      <div className="pointer-events-none absolute inset-0 z-0 space-depth" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-84 space-starfield" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-72 space-starfield-fine" />

      {/* Full-screen composition: hero overlay + constellation layer */}
      <div className="relative z-10 flex h-full flex-col">

        {/* ── Hero column ──────────────────────────────────────────────────── */}
        <div className="relative z-10 flex h-full flex-col px-8 py-8 lg:pl-[11%] lg:pr-12 lg:py-10">

          {/* Top strip — meta + credit capsules */}
          <div className="mb-4 flex items-center gap-10 max-w-[380px] lg:mb-5">
            <span
              className="inline-flex items-center rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] tracking-[0.24em] text-[var(--text-muted)] uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="text-[color:var(--accent)]">ADCC </span>· 1998–2024
            </span>
            <a
              href="https://www.linkedin.com/in/renzorico"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] tracking-[0.24em] text-[var(--text-dim)] uppercase transition-colors duration-200 hover:text-[color:var(--text-secondary)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Made by Renzo Rico
            </a>
          </div>

          {/* Center — dominant title + slogan + metrics */}
          <div className="-mt-3 flex flex-col pt-0 lg:-mt-11 lg:pt-0 lg:max-w-[380px]">

            <div>
              <img
                src={logoUrl}
                alt="ADCC"
                className="h-[clamp(12rem,30vw,24rem)] w-auto opacity-95"
              />
              <h1
                className="-mt-20 lg:-mt-24 font-display font-bold leading-[0.4] tracking-[0.08em] text-[var(--text-primary)] uppercase"
                style={{ fontSize: 'clamp(4.25rem, 8.2vw, 5.8rem)' }}
              >
                UNIVERSE
              </h1>
            </div>

            <h2
              className="mt-8 font-sans font-normal tracking-[0.01em] text-justify text-[color:var(--text-secondary)] lg:mt-9"
              style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1.15rem)', lineHeight: '1.55', maxWidth: '380px' }}
            >
              See the world’s toughest grappling tournament as one connected network.
            </h2>

            <p
              className="mt-6 text-justify text-[color:var(--text-dim)]"
              style={{
                fontSize: 'clamp(0.85rem, 1.1vw, 0.98rem)',
                lineHeight: '1.65',
                maxWidth: '380px',
              }}
            >
              This is a 3D explorer of ADCC history — a living graph where athletes, matches, rivalries, and eras connect across the world&apos;s most prestigious submission grappling tournament.
              <br></br>Filter by year, division, and weight to see eras emerge, rivalries evolve, and hidden paths between athletes you&apos;d never think to connect.
            </p>

          </div>

          {/* Bottom — slide threshold control for entering the universe */}
          <div className="mt-auto pt-6 pb-1 max-w-[380px]">
            <div
              ref={entryTrackRef}
              role="slider"
              aria-label="Slide to enter observatory"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(entryProgress * 100)}
              aria-valuetext={isEntering ? 'Entering observatory' : 'Slide to enter observatory'}
              tabIndex={isEntering ? -1 : 0}
              className="group relative h-14 w-full touch-none select-none overflow-hidden rounded-full border border-white/16 bg-[linear-gradient(180deg,rgba(22,18,18,0.74),rgba(10,9,10,0.82))] outline-none ring-1 ring-white/6 backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onPointerDown={handleEntryPointerDown}
              onPointerMove={handleEntryPointerMove}
              onPointerUp={handleEntryPointerEnd}
              onPointerCancel={resetEntryControl}
              onKeyDown={handleEntryKeyDown}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(201,45,40,0.34),rgba(210,171,115,0.22))] ${isEntryDragging || isEntering ? '' : 'transition-all duration-500 ease-out'}`}
                style={{
                  width: `calc(${Math.max(0.08, entryProgress) * 100}% + ${ENTRY_HANDLE_SIZE / 2}px)`,
                  boxShadow: '0 0 38px rgba(201,45,40,0.28)',
                }}
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-20">
                <span
                  className={`truncate text-[10px] tracking-[0.26em] uppercase transition-colors duration-300 ${
                    isEntering || entryProgress >= ENTRY_THRESHOLD
                      ? 'text-[color:var(--accent-warm)]'
                      : 'text-[color:var(--text-muted)]'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {isEntering
                    ? 'Entering Observatory'
                    : entryProgress >= ENTRY_THRESHOLD
                      ? 'Release To Enter'
                      : 'Slide To Enter'}
                </span>
              </div>

              <div
                className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(226,139,129,0.54)] bg-[linear-gradient(180deg,rgba(120,33,29,0.92),rgba(34,14,14,0.97))] shadow-[0_0_26px_rgba(201,45,40,0.42),inset_0_1px_0_rgba(255,255,255,0.2)] ${isEntryDragging || isEntering ? '' : 'transition-all duration-500 ease-out'}`}
                style={{
                  left: `calc(${entryProgress * 100}% - ${entryProgress * ENTRY_HANDLE_SIZE}px)`,
                }}
              >
                <span className="text-[14px] text-[color:var(--text-primary)]">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Constellation — full-screen atmospheric layer, hidden on mobile */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">

          {/* SVG: connection lines between nodes */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Connection lines */}
            {connections.map(([fromIndex, toIndex]) => {
              const from = bubbleMetrics[fromIndex];
              const to = bubbleMetrics[toIndex];
              const x1 = parseFloat(from.left);
              const y1 = parseFloat(from.top);
              const x2 = parseFloat(to.left);
              const y2 = parseFloat(to.top);
              const curveSign = (fromIndex + toIndex) % 2 === 0 ? 1 : -1;
              const controlX = (x1 + x2) / 2 + curveSign * 2.1;
              const controlY = (y1 + y2) / 2 + curveSign * 0.9;
              return (
                <path
                  key={`${from.label}-${to.label}`}
                  d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
                  fill="none"
                  stroke="rgba(226,204,178,0.48)"
                  strokeWidth="0.28"
                  strokeLinecap="round"
                  className="universe-line"
                />
              );
            })}
          </svg>

          {/* Floating metric bubbles */}
          {bubbleMetrics.map((bubble) => {
            const motion = tierMotion[bubble.tier];
            const driftDuration = `${(bubble.driftDuration * motion.driftFactor).toFixed(1)}s`;
            const pulseDuration = `${(bubble.pulseDuration * motion.pulseFactor).toFixed(1)}s`;
            const glowSpread =
              bubble.tier === 'large'
                ? Math.round(bubble.size * 0.52)
                : bubble.tier === 'medium'
                  ? Math.round(bubble.size * 0.45)
                  : Math.round(bubble.size * 0.38);

            const bubbleStyle = {
              top: bubble.top,
              left: bubble.left,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `radial-gradient(circle at 42% 34%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 38%, transparent 58%), radial-gradient(circle at 50% 50%, ${bubble.accent} 0%, rgba(6,5,9,0.96) 72%)`,
              boxShadow: `0 0 ${glowSpread}px ${bubble.glowColor}, 0 0 ${Math.round(glowSpread * 0.45)}px ${bubble.glowColor}`,
              border: `1px solid ${bubble.borderColor}`,
              '--drift-x': bubble.driftX,
              '--drift-y': bubble.driftY,
              '--drift-duration': driftDuration,
              '--pulse-duration': pulseDuration,
              '--drift-scale': motion.driftScale,
            } as CSSProperties & Record<string, string>;

            return (
              <div
                key={bubble.label}
                className="universe-bubble absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full backdrop-blur-md"
                style={bubbleStyle}
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: bubble.tier === 'large' ? '64%' : bubble.tier === 'medium' ? '68%' : '74%',
                    height: bubble.tier === 'large' ? '64%' : bubble.tier === 'medium' ? '68%' : '74%',
                    background:
                      'radial-gradient(circle, rgba(6,6,8,0.56) 0%, rgba(6,6,8,0.26) 56%, transparent 100%)',
                  }}
                />
                <div className="relative z-10 flex max-w-[80%] flex-col items-center justify-center text-center">
                  {renderBubbleTextLayout(bubble)}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function renderBubbleTextLayout(bubble: MetricBubble) {
  if (bubble.tier === 'large') {
    return (
      <>
        <p
          className="text-center font-semibold uppercase leading-none"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            letterSpacing: '0.24em',
            color: bubble.labelColor,
            textShadow: '0 1px 8px rgba(0,0,0,0.42)',
          }}
        >
          {bubble.label}
        </p>
        <p
          className="font-display mt-1.5 text-center font-bold leading-none"
          style={{
            fontSize: '2.75rem',
            color: bubble.valueColor,
            textShadow: '0 2px 10px rgba(0,0,0,0.45)',
          }}
        >
          {bubble.value}
        </p>
      </>
    );
  }

  if (bubble.tier === 'medium') {
    return (
      <>
        <p
          className="text-center font-semibold uppercase leading-none"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8.5px',
            letterSpacing: '0.18em',
            color: bubble.labelColor,
            textShadow: '0 1px 7px rgba(0,0,0,0.38)',
          }}
        >
          {bubble.label}
        </p>
        <p
          className="font-display mt-1 text-center font-bold leading-none"
          style={{
            fontSize: '1.72rem',
            color: bubble.valueColor,
            textShadow: '0 2px 8px rgba(0,0,0,0.42)',
          }}
        >
          {bubble.value}
        </p>
      </>
    );
  }

  return (
    <>
      <p
        className="text-center font-semibold uppercase leading-none"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8.5px',
          letterSpacing: '0.18em',
          color: bubble.labelColor,
          textShadow: '0 1px 6px rgba(0,0,0,0.38)',
        }}
      >
        {bubble.label}
      </p>
      <p
        className="font-display mt-1 text-center font-bold leading-none"
        style={{
          fontSize: '1.58rem',
          color: bubble.valueColor,
          textShadow: '0 2px 8px rgba(0,0,0,0.42)',
        }}
      >
        {bubble.value}
      </p>
    </>
  );
}
