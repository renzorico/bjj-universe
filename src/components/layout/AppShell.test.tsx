import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

vi.mock('@/features/graph/components/GraphCanvas', () => ({
  GraphCanvas: () => <div aria-label="Interactive athlete graph" />,
}));

describe('AppShell', () => {
  it('renders the phase 2 shell with the live graph experience', () => {
    render(<AppShell />);

    expect(
      screen.getByRole('heading', { name: 'BJJ Universe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'A living grappling atlas, not a dashboard',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'The first interactive BJJ Universe scene',
      }),
    ).toBeInTheDocument();
  });
});
