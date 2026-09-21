import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Home from './page';

it('renders an honest, disabled testnet swap preview', () => {
  render(<Home />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Trade with context, not guesswork.' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Prototype · No live data')).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Swap preview' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Wallet integration pending' })).toBeDisabled();
  expect(
    screen.getByText(/wallet, network, quote provider, and contracts are not connected/i),
  ).toBeInTheDocument();
});
