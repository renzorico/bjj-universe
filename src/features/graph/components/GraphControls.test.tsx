import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GraphControls } from '@/features/graph/components/GraphControls';
import { GraphFilters } from '@/features/graph/lib/types';

const baseFilters: GraphFilters = {
  yearRange: { start: 1998, end: 2022 },
  sex: null,
  weightClass: null,
  displayMode: 'all',
};

describe('GraphControls', () => {
  it('resets to all years and filters weight classes by sex', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GraphControls
        filters={baseFilters}
        years={[1998, 2001, 2022]}
        sexes={['F', 'M']}
        weightClasses={['60KG', '77KG']}
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'All years' }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /sex filter/i }),
      'F',
    );

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      sex: 'F',
      weightClass: null,
    });

    await user.click(screen.getByRole('button', { name: 'All years' }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...baseFilters,
      yearRange: { start: 1998, end: 2022 },
    });
  });
});
