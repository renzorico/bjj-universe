import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AthleteList } from '@/features/graph/components/AthleteList';
import { SceneNodeViewModel } from '@/features/graph/lib/types';

const athletes: SceneNodeViewModel[] = [
  {
    id: 'a1',
    label: 'Nicholas Meregali',
    displaySex: 'M',
    displayPrimaryWeightClass: '99KG',
    displayActiveYearFirst: 2022,
    displayActiveYearLast: 2024,
    displayTotalMatches: 8,
    size: 10,
    wins: 3,
    losses: 1,
    yearsActive: [2022, 2024],
    sexes: ['M'],
    weightClasses: ['99KG'],
    nationality: 'Brazil',
    team: 'Alliance',
    bridgeScore: 5,
    activeMatches: 4,
    position: { x: 0, y: 0 },
  },
  {
    id: 'a2',
    label: 'Gordon Ryan',
    displaySex: 'M',
    displayPrimaryWeightClass: '99KG',
    displayActiveYearFirst: 2019,
    displayActiveYearLast: 2024,
    displayTotalMatches: 21,
    size: 10,
    wins: 6,
    losses: 0,
    yearsActive: [2019, 2024],
    sexes: ['M'],
    weightClasses: ['99KG'],
    nationality: 'USA',
    team: 'New Wave',
    bridgeScore: 7,
    activeMatches: 8,
    position: { x: 1, y: 1 },
  },
];

describe('AthleteList', () => {
  it('opens the results panel above the search input and keeps search interactions intact', async () => {
    const user = userEvent.setup();
    const onSelectAthlete = vi.fn();

    render(
      <AthleteList
        athletes={athletes}
        selectedAthleteId={null}
        onSelectAthlete={onSelectAthlete}
      />,
    );

    await user.click(screen.getByRole('searchbox', { name: /search athletes/i }));

    expect(screen.getByTestId('athlete-results-panel')).toHaveClass(
      'bottom-[calc(100%+0.35rem)]',
    );
    expect(screen.getByRole('listbox', { name: /athlete results/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sort by name/i }));
    await user.type(
      screen.getByRole('searchbox', { name: /search athletes/i }),
      'meregali',
    );
    await user.click(screen.getByTestId('athlete-list-item-a1'));

    expect(onSelectAthlete).toHaveBeenCalledWith('a1');
  });
});
