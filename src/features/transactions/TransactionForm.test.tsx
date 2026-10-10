import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { TransactionForm } from './TransactionForm';

const account = (id: string, name: string, currency: string, archived = false) => ({
  id,
  name,
  type: 'asset' as const,
  currency,
  archived,
  balance: 0,
});

const mockAccounts = [
  account('brl', 'Checking', 'BRL'),
  account('usd', 'Dollars', 'USD'),
  account('btc', 'Bitcoin', 'BTC'),
  account('old', 'Old account', 'BRL', true),
];

jest.mock('@/data/transactions', () => ({
  useAccountsWithBalances: () => ({ data: mockAccounts, error: undefined, loading: false }),
}));

const row = (n: number) => screen.getByTestId(`posting-${n}`);

async function fill(n: number, accountName: string, side: 'Debit' | 'Credit', amount: string) {
  await fireEvent.press(within(row(n)).getByLabelText('Account'));
  await fireEvent.press(screen.getByRole('option', { name: accountName }));
  await fireEvent.press(within(row(n)).getByRole('radio', { name: side }));
  await fireEvent.changeText(within(row(n)).getByLabelText('Amount'), amount);
}

const save = () => screen.getByRole('button', { name: 'Save transaction' });

describe('TransactionForm', () => {
  it('balances one credit against three debits and unbalances by a centavo', async () => {
    const onSubmit = jest.fn();
    await render(<TransactionForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Split');
    await fireEvent.press(screen.getByRole('button', { name: 'Add posting' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add posting' }));
    await fill(1, 'Checking', 'Credit', '1000.00');
    await fill(2, 'Checking', 'Debit', '400.00');
    await fill(3, 'Checking', 'Debit', '350.00');
    await fill(4, 'Checking', 'Debit', '250.00');
    expect(screen.getByTestId('difference')).toHaveTextContent(/0[.,]00/);
    expect(save()).toBeEnabled();

    await fireEvent.changeText(within(row(4)).getByLabelText('Amount'), '249.99');
    expect(screen.getByTestId('difference')).toHaveTextContent(/0[.,]01/);
    expect(save()).toBeDisabled();
  });

  it('rejects too many decimals per currency', async () => {
    await render(<TransactionForm onSubmit={jest.fn()} />);
    await fill(1, 'Bitcoin', 'Debit', '0.00500000');
    expect(screen.queryByText(/up to 8 decimals for BTC/)).toBeNull();
    await fireEvent.changeText(within(row(1)).getByLabelText('Amount'), '0.005000001');
    expect(screen.getByText(/up to 8 decimals for BTC/)).toBeTruthy();

    await fill(2, 'Checking', 'Debit', '1.234');
    expect(screen.getByText(/up to 2 decimals for BRL/)).toBeTruthy();
  });

  it('computes the BRL value of a foreign posting and lets it be overwritten', async () => {
    await render(<TransactionForm onSubmit={jest.fn()} />);
    await fill(1, 'Dollars', 'Debit', '100.00');
    await fireEvent.changeText(within(row(1)).getByLabelText('Rate'), '5.20');
    expect(within(row(1)).getByLabelText('BRL value').props.value).toBe('520.00');
    expect(screen.getByTestId('total-debits')).toHaveTextContent(/520[.,]00/);

    await fireEvent.changeText(within(row(1)).getByLabelText('BRL value'), '520.01');
    expect(screen.getByTestId('total-debits')).toHaveTextContent(/520[.,]01/);
  });

  it('does not offer archived accounts and never drops below two postings', async () => {
    await render(<TransactionForm onSubmit={jest.fn()} />);
    await fireEvent.press(within(row(1)).getByLabelText('Account'));
    expect(screen.queryByRole('option', { name: 'Old account' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(3);

    expect(screen.queryByRole('button', { name: /Remove posting/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Add posting' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Remove posting 3' }));
    expect(screen.queryByTestId('posting-3')).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove posting/ })).toBeNull();
  });

  it('does not submit again after a successful save', async () => {
    const onSubmit = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    await render(<TransactionForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Groceries');
    await fill(1, 'Checking', 'Credit', '90.00');
    await fill(2, 'Checking', 'Debit', '90.00');
    // The first press resolves, the screen has not navigated yet, and a late tap must not save again.
    // The overlap of two taps while the save is pending is covered in e2e/new-transaction.spec.ts.
    await fireEvent.press(save());
    await fireEvent.press(save());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(save()).toBeDisabled();
  });

  it('shows the error of a rejected save and keeps the form values', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('account is archived')).mockResolvedValue(undefined);
    await render(<TransactionForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Groceries');
    await fill(1, 'Checking', 'Credit', '90.00');
    await fill(2, 'Checking', 'Debit', '90.00');
    await fireEvent.press(save());
    expect(await screen.findByText('account is archived')).toBeTruthy();
    expect(screen.getByLabelText('Description').props.value).toBe('Groceries');
    expect(within(row(1)).getByLabelText('Amount').props.value).toBe('90.00');
    expect(save()).toBeEnabled();

    await fireEvent.press(save());
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('account is archived')).toBeNull();
  });

  it('starts filled with a stored transaction and blocks saving while one side changes', async () => {
    const onSubmit = jest.fn();
    const initial = {
      id: 't1',
      date: '2026-10-01',
      description: 'Groceries',
      postings: [
        { id: 'p1', transactionId: 't1', accountId: 'brl', side: 'credit' as const, amount: 10000, rate: null, amountBrl: 10000 },
        { id: 'p2', transactionId: 't1', accountId: 'usd', side: 'debit' as const, amount: 2000, rate: 500000000, amountBrl: 10000 },
      ],
    };
    await render(<TransactionForm initial={initial} onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Description').props.value).toBe('Groceries');
    expect(screen.getByLabelText('Date').props.value).toBe('2026-10-01');
    expect(within(row(1)).getByLabelText('Amount').props.value).toBe('100.00');
    expect(within(row(2)).getByLabelText('Amount').props.value).toBe('20.00');
    expect(within(row(2)).getByLabelText('Rate').props.value).toBe('5.0');
    expect(within(row(2)).getByLabelText('BRL value').props.value).toBe('100.00');
    expect(save()).toBeEnabled();

    await fireEvent.changeText(within(row(1)).getByLabelText('Amount'), '130.00');
    expect(screen.getByTestId('difference')).toHaveTextContent(/30[.,]00/);
    expect(save()).toBeDisabled();

    await fireEvent.changeText(within(row(2)).getByLabelText('Amount'), '26.00');
    expect(save()).toBeEnabled();
    await fireEvent.press(save());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        postings: [
          { accountId: 'brl', side: 'credit', amount: 13000, rate: null, amountBrl: 13000 },
          { accountId: 'usd', side: 'debit', amount: 2600, rate: 500000000, amountBrl: 13000 },
        ],
      }),
    );
  });

  it('submits the draft when balanced', async () => {
    const onSubmit = jest.fn();
    await render(<TransactionForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Groceries');
    await fill(1, 'Checking', 'Credit', '90.00');
    await fill(2, 'Checking', 'Debit', '90.00');
    await fireEvent.press(save());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Groceries',
        postings: [
          { accountId: 'brl', side: 'credit', amount: 9000, rate: null, amountBrl: 9000 },
          { accountId: 'brl', side: 'debit', amount: 9000, rate: null, amountBrl: 9000 },
        ],
      }),
    );
  });
});
