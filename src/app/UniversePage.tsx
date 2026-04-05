import { AppRoute } from '@/app/useAppRoute';
import { GraphStage } from '@/features/graph/components/GraphStage';
import { UniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

interface UniversePageProps {
  onNavigate: (route: AppRoute) => void;
  snapshot: UniverseSnapshot;
  introToken: number;
}

export function UniversePage({
  onNavigate,
  snapshot,
  introToken,
}: UniversePageProps) {
  return (
    <div className="page-reveal relative h-dvh overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Deep-space atmosphere — behind the graph */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(130,182,255,0.13),transparent_55%),radial-gradient(ellipse_44%_36%_at_82%_18%,rgba(84,219,199,0.07),transparent_55%),radial-gradient(ellipse_60%_50%_at_12%_80%,rgba(84,219,199,0.04),transparent_55%)]" />
      <GraphStage
        snapshot={snapshot}
        onNavigate={onNavigate}
        introToken={introToken}
      />
    </div>
  );
}
