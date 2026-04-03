import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GraphStage } from '@/features/graph/components/GraphStage';
import { createUniverseSnapshot } from '@/features/graph/lib/createUniverseSnapshot';

vi.mock('@/features/graph/components/GraphCanvas', () => ({
  GraphCanvas: ({
    onSelectAthlete,
  }: {
    onSelectAthlete: (athleteId: string | null) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSelectAthlete('athlete_kade-ruotolo')}
    >
      Select Kade from graph
    </button>
  ),
}));

describe('GraphStage', () => {
  it('shows athlete details after selecting an athlete and clears them', async () => {
    const user = userEvent.setup();

    render(<GraphStage snapshot={createUniverseSnapshot()} />);

    await user.click(
      screen.getByRole('button', { name: 'Select Kade from graph' }),
    );

    expect(screen.getByTestId('athlete-detail-panel')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Kade Ruotolo' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Won over JT Torres/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByText('Select an athlete')).toBeInTheDocument();
  });
});
