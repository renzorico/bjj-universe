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
      screen.getByRole('heading', { name: /universe/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /toughest grappling/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders the dedicated universe route with the graph explorer', () => {
    render(<AppShell route="/universe" onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('heading', {
        name: 'Node graph explorer',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Real ADCC graph exploration')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Interactive athlete graph'),
    ).toBeInTheDocument();
  });
});
