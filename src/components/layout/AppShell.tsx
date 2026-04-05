import { LandingPage } from '@/app/LandingPage';
import { UniversePage } from '@/app/UniversePage';
import { AppRoute } from '@/app/useAppRoute';
import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

const snapshot = createUniverseSnapshot();

interface AppShellProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  universeIntroToken: number;
}

export function AppShell({
  route,
  onNavigate,
  universeIntroToken,
}: AppShellProps) {
  if (route === '/universe') {
    return (
      <UniversePage
        onNavigate={onNavigate}
        snapshot={snapshot}
        introToken={universeIntroToken}
      />
    );
  }

  return <LandingPage onNavigate={onNavigate} snapshot={snapshot} />;
}
