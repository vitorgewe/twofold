import { fireEvent, render, screen, within } from '@testing-library/react-native';

import NewTransaction from '../../../app/transactions/new';
import { archiveAccount, createAccount } from '@/data/accounts';
import { migrations, runMigrations, type Database } from '@/data/database';
import { createTestDatabase } from '@/data/sqljs-adapter';
import { listTransactions } from '@/data/transactions';

const mockDismissTo = jest.fn();
let mockDb: Database;

jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));
jest.mock('@/data/database', () => ({
  ...jest.requireActual('@/data/database'),
  getDatabase: async () => mockDb,
}));

const row = (n: number) => screen.getByTestId(`posting-${n}`);

async function fill(n: number, accountName: string, side: 'Debit' | 'Credit', amount: string) {
  await fireEvent.press(within(row(n)).getByLabelText('Account'));
  await fireEvent.press(await screen.findByRole('option', { name: accountName }));
  await fireEvent.press(within(row(n)).getByRole('radio', { name: side }));
  await fireEvent.changeText(within(row(n)).getByLabelText('Amount'), amount);
}

describe('saving from the new-transaction route', () => {
  beforeEach(async () => {
    mockDismissTo.mockClear();
    mockDb = await createTestDatabase();
    await runMigrations(mockDb, migrations);
  });

  it('stores the trimmed transaction and goes to Home', async () => {
    await createAccount(mockDb, { name: 'Cash', type: 'asset', currency: 'BRL' });
    await createAccount(mockDb, { name: 'Food', type: 'expense', currency: 'BRL' });
    await render(<NewTransaction />);
    await fireEvent.changeText(screen.getByLabelText('Description'), '  Lunch  ');
    await fill(1, 'Cash', 'Credit', '42.50');
    await fill(2, 'Food', 'Debit', '42.50');
    await fireEvent.press(screen.getByRole('button', { name: 'Save transaction' }));

    expect(mockDismissTo).toHaveBeenCalledWith('/');
    const stored = await listTransactions(mockDb);
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe('Lunch');
  });

  it('shows the repository error and keeps the form when the write is rejected', async () => {
    await createAccount(mockDb, { name: 'Cash', type: 'asset', currency: 'BRL' });
    const food = await createAccount(mockDb, { name: 'Food', type: 'expense', currency: 'BRL' });
    await render(<NewTransaction />);
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch');
    await fill(1, 'Cash', 'Credit', '42.50');
    await fill(2, 'Food', 'Debit', '42.50');
    // The account is archived after it was chosen, so the form still offers a balanced draft.
    await archiveAccount(mockDb, food.id);
    await fireEvent.press(screen.getByRole('button', { name: 'Save transaction' }));

    expect(await screen.findByText(/archived/)).toBeTruthy();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Description').props.value).toBe('Lunch');
    expect(within(row(2)).getByLabelText('Amount').props.value).toBe('42.50');
    expect(await listTransactions(mockDb)).toHaveLength(0);
  });
});
