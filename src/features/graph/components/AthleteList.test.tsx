import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AthleteList } from '@/features/graph/components/AthleteList';
import { SceneNodeViewModel } from '@/features/graph/lib/types';

const athletes: SceneNodeViewModel[] = [
  {
    id: 'athlete_1',
    label: 'Nicholas Meregali',
    size: 22,
    wins: 4,
    losses: 1,
    yearsActive: [2022],
    sexes: ['M'],
    weightClasses: ['99KG'],
    bridgeScore: 31,
    position: { x: 50, y: 50 },
    activeMatches: 5,
  },
  {
    id: 'athlete_2',
    label: 'Henrique Cardoso',
    size: 16,
    wins: 1,
    losses: 2,
    yearsActive: [2022],
    sexes: ['M'],
    weightClasses: ['99KG'],
    bridgeScore: 12,
    position: { x: 62, y: 54 },
    activeMatches: 3,
  },
  {
    id: 'athlete_3',
    label: 'Ronaldo Junior',
    size: 16,
    wins: 1,
    losses: 1,
    yearsActive: [2022],
    sexes: ['M'],
    weightClasses: ['99KG'],
    bridgeScore: 10,
    position: { x: 40, y: 60 },
    activeMatches: 2,
  },
];

describe('AthleteList', () => {
  it('opens on focus, supports sorting, and keeps selection actionable', async () => {
    const user = userEvent.setup();
    const onSelectAthlete = vi.fn();

    render(
      <div>
        <AthleteList
          athletes={athletes}
          selectedAthleteId={null}
          onSelectAthlete={onSelectAthlete}
        />
        <button type="button">Outside target</button>
      </div>,
    );

    expect(
      screen.queryByRole('button', { name: /nicholas meregali/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('searchbox', { name: /search athletes/i }),
    );

    expect(
      screen.getByRole('button', { name: /nicholas meregali/i }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /athlete sort/i }),
      'name',
    );

    await user.type(
      screen.getByRole('searchbox', { name: /search athletes/i }),
      'mereg',
    );

    expect(
      screen.getByRole('button', { name: /nicholas meregali/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /henrique cardoso/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /nicholas meregali/i }),
    );

    expect(onSelectAthlete).toHaveBeenCalledWith('athlete_1');
    expect(
      screen.queryByRole('button', { name: /nicholas meregali/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('searchbox', { name: /search athletes/i }),
    );
    expect(
      screen.getByRole('button', { name: /henrique cardoso/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Outside target' }));
    expect(
      screen.queryByRole('button', { name: /henrique cardoso/i }),
    ).not.toBeInTheDocument();
  });
});
