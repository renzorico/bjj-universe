import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

vi.mock('@/features/graph/components/GraphCanvas', () => ({
  GraphCanvas: () => <div aria-label="Interactive athlete graph" />,
}));

describe('AppShell', () => {
  it('renders the lightweight landing page on the overview route', () => {
    render(<AppShell route="/" onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'BJJ Universe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /A dedicated network explorer for rivalry, eras, and hidden structure in ADCC history/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders the dedicated universe route with the graph explorer', () => {
    render(<AppShell route="/universe" onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('heading', {
        name: 'Real ADCC graph explorer',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Interactive athlete graph'),
    ).toBeInTheDocument();
  });
});
