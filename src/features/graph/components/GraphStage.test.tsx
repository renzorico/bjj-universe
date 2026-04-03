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
    <button type="button" onClick={() => onSelectAthlete('athlete_7507')}>
      Select Meregali from graph
    </button>
  ),
}));

describe('GraphStage', () => {
  it('shows athlete details after selecting an athlete, clears them, and toggles notes', async () => {
    const user = userEvent.setup();

    render(<GraphStage snapshot={createUniverseSnapshot()} />);

    expect(
      screen.queryByTestId('athlete-detail-panel'),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Select Meregali from graph' }),
    );

    expect(screen.getByTestId('athlete-detail-panel')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nicholas Meregali' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Won over Henrique Cardoso/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      screen.queryByTestId('athlete-detail-panel'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Athlete detail' }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        /Use the search bar to inspect an athlete profile quickly/i,
      ),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Interaction notes/i }),
    );

    expect(
      screen.getByText(
        /Use the search bar to inspect an athlete profile quickly/i,
      ),
    ).toBeInTheDocument();
  });
});
