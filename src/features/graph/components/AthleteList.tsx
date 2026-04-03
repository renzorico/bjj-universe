import { SceneNodeViewModel } from '@/features/graph/lib/types';

interface AthleteListProps {
  athletes: SceneNodeViewModel[];
  selectedAthleteId: string | null;
  onSelectAthlete: (athleteId: string) => void;
}

export function AthleteList({
  athletes,
  selectedAthleteId,
  onSelectAthlete,
}: AthleteListProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
          Athlete list
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Precision fallback for touch and tests
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {athletes.map((athlete) => (
          <button
            key={athlete.id}
            type="button"
            data-testid={`athlete-list-item-${athlete.id}`}
            className={`rounded-full border px-3 py-2 text-sm transition ${
              selectedAthleteId === athlete.id
                ? 'border-[var(--accent)] bg-[rgba(122,162,255,0.16)] text-white'
                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
            }`}
            onClick={() => onSelectAthlete(athlete.id)}
          >
            {athlete.label}
          </button>
        ))}
      </div>
    </div>
  );
}
