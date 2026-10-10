import { render, screen } from '@testing-library/react-native';

import { BRL, USD } from '@/features/ledger/currency';

import { MoneyText } from './MoneyText';

describe('MoneyText', () => {
  it('shows only the BRL value for a BRL amount', async () => {
    await render(<MoneyText brl={12345} currency={BRL} native={12345} />);
    expect(screen.getByText(/R\$\s?123[.,]45/)).toBeTruthy();
    expect(screen.queryByText(/USD/)).toBeNull();
  });

  it('shows BRL as the main text and the original amount muted for a foreign value', async () => {
    await render(<MoneyText brl={50000} currency={USD} native={10000} />);
    expect(screen.getByText(/R\$\s?500[.,]00/)).toBeTruthy();
    const original = screen.getByText(/USD\s?100[.,]00/);
    expect(original).toBeTruthy();
    expect(original.props.style).toEqual(expect.objectContaining({ color: '#6b7280' }));
  });
});
