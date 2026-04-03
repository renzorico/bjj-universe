import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

describe('AppShell', () => {
  it('renders the graph-first shell with key phase 1 messaging', () => {
    render(<AppShell />);

    expect(
      screen.getByRole('heading', { name: 'BJJ Universe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'A living grappling atlas, not a dashboard',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Graph stage preview')).toBeInTheDocument();
  });
});
