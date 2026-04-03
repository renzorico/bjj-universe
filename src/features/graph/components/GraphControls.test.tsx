import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GraphControls } from '@/features/graph/components/GraphControls';
import { GraphFilters } from '@/features/graph/lib/types';

const baseFilters: GraphFilters = {
  year: null,
  sex: null,
  weightClass: null,
  displayMode: 'all',
};

describe('GraphControls', () => {
  it('switches between all years and a specific year, and filters weight classes by sex', async () => {
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

    fireEvent.change(screen.getByRole('slider', { name: /year filter/i }), {
      target: { value: '2021' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      year: 2021,
    });

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
      year: null,
    });
  });
});
