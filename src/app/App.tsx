import { AppShell } from '@/components/layout/AppShell';
import { useAppRoute } from '@/app/useAppRoute';

export function App() {
  const { route, navigate } = useAppRoute();

  return <AppShell route={route} onNavigate={navigate} />;
}
