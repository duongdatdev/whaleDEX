import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Home from './page';

it('renders the application landing page', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { level: 1, name: 'DEX App' })).toBeInTheDocument();
});
