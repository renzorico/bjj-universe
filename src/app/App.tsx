import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAppRoute, AppRoute } from '@/app/useAppRoute';

export function App() {
  const { route, navigate } = useAppRoute();
  const [covered, setCovered] = useState(false);
  const [universeIntroToken, setUniverseIntroToken] = useState(0);
  const pendingRef = useRef<AppRoute | null>(null);
  const phaseRef = useRef<'idle' | 'covering' | 'uncovering'>('idle');

  const handleNavigate = (nextRoute: AppRoute) => {
    if (nextRoute === route || phaseRef.current !== 'idle') return;

    if (route === '/' && nextRoute === '/universe') {
      setUniverseIntroToken((current) => current + 1);
    }

    pendingRef.current = nextRoute;
    phaseRef.current = 'covering';
    setCovered(true);
  };

  const handleVeilEnd = () => {
    if (phaseRef.current === 'covering') {
      const pending = pendingRef.current;
      if (pending) {
        navigate(pending);
        pendingRef.current = null;
      }
      phaseRef.current = 'uncovering';
      setCovered(false);
    } else if (phaseRef.current === 'uncovering') {
      phaseRef.current = 'idle';
    }
  };

  return (
    <>
      <AppShell
        route={route}
        onNavigate={handleNavigate}
        universeIntroToken={universeIntroToken}
      />
      <div
        aria-hidden="true"
        onTransitionEnd={handleVeilEnd}
        className="pointer-events-none fixed inset-0 z-[9999] bg-[#030709]"
        style={{
          opacity: covered ? 1 : 0,
          transition: `opacity ${covered ? '380ms' : '320ms'} ease-in-out`,
        }}
      />
    </>
  );
}
