import { SurfaceCard } from '@/components/surfaces/SurfaceCard';

const pipelineSteps = [
  {
    title: 'Raw ingestion',
    description: 'ADCC source rows remain untouched and auditable.',
  },
  {
    title: 'Normalization',
    description:
      'Canonical athletes, events, and match records become queryable domain objects.',
  },
  {
    title: 'Derived metrics',
    description:
      'Wins, losses, rivalry counts, years active, bridge scores, and future centrality fit here.',
  },
  {
    title: 'Graph view models',
    description:
      'UI consumes typed nodes, edges, and filters rather than raw source records.',
  },
];

export function DataPipelinePanel() {
  return (
    <SurfaceCard
      eyebrow="Data Architecture"
      title="A pipeline designed for expansion"
      description="Phase 1 keeps future Elo, embeddings, recommendations, and multi-source data from leaking into UI components."
    >
      <ol className="space-y-4">
        {pipelineSteps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-[22px] border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="font-display flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-lg text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SurfaceCard>
  );
}
