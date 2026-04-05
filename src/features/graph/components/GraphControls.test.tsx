import { render, screen, fireEvent } from '@testing-library/react';
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
  it('updates year, sex, weight class, and display mode filters', async () => {
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

    // Year slider starts at "All years"
    const yearSlider = screen.getByRole('slider', { name: /year filter/i });
    expect(yearSlider).toHaveValue('0');

    // Move slider to position 3 → 2022
    fireEvent.change(yearSlider, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      year: 2022,
    });

    await user.click(screen.getByRole('button', { name: 'Women' }));

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      sex: 'F',
      weightClass: null,
    });

    await user.selectOptions(
      screen.getByRole('combobox', { name: /weight class filter/i }),
      '77KG',
    );

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      weightClass: '77KG',
    });

    await user.click(screen.getByRole('button', { name: 'Rivalry' }));

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      displayMode: 'rivalry',
    });
  });
});
