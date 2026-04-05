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
      onClick={() => onSelectAthlete('athlete_nicholas-meregali-m')}
    >
      Select Meregali from graph
    </button>
  ),
}));

describe('GraphStage', () => {
  it('supports search selection and collapsed match history in the detail panel', async () => {
    const user = userEvent.setup();

    render(<GraphStage snapshot={createUniverseSnapshot()} />);

    expect(
      screen.queryByTestId('athlete-detail-panel'),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('searchbox', { name: /search athletes/i }),
    );
    expect(screen.getByRole('listbox', { name: /athlete results/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sort by name/i }));
    await user.type(
      screen.getByRole('searchbox', { name: /search athletes/i }),
      'meregali',
    );

    await user.click(
      screen.getByTestId('athlete-list-item-athlete_nicholas-meregali-m'),
    );

    expect(screen.getByTestId('athlete-detail-panel')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nicholas Meregali' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('New Wave Jiu Jitsu')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getAllByText('99KG').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Won over Henrique Cardoso/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show/i }));
    expect(screen.getByText(/Won over Henrique Cardoso/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      screen.queryByTestId('athlete-detail-panel'),
    ).not.toBeInTheDocument();
  });

  it('shows athlete details after selecting an athlete from the graph and clears them', async () => {
    const user = userEvent.setup();

    render(<GraphStage snapshot={createUniverseSnapshot()} />);

    await user.click(
      screen.getByRole('button', { name: 'Select Meregali from graph' }),
    );

    expect(screen.getByTestId('athlete-detail-panel')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nicholas Meregali' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      screen.queryByTestId('athlete-detail-panel'),
    ).not.toBeInTheDocument();
  });
});
