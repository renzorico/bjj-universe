import { LandingPage } from '@/app/LandingPage';
import { UniversePage } from '@/app/UniversePage';
import { AppRoute } from '@/app/useAppRoute';
import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

const snapshot = createUniverseSnapshot();

interface AppShellProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function AppShell({ route, onNavigate }: AppShellProps) {
  if (route === '/universe') {
    return <UniversePage onNavigate={onNavigate} snapshot={snapshot} />;
  }

  return <LandingPage onNavigate={onNavigate} snapshot={snapshot} />;
}
