import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createAccount } from '@/data/accounts';
import { migrations, runMigrations, type Database } from '@/data/database';
import { createTestDatabase } from '@/data/sqljs-adapter';
import { createTransaction } from '@/data/transactions';

import { TransactionDetailScreen } from './TransactionDetailScreen';

let mockDb: Database;
const mockDismissTo = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, children),
  useRouter: () => ({ dismissTo: mockDismissTo }),
}));
jest.mock('@/data/database', () => ({
  ...jest.requireActual('@/data/database'),
  getDatabase: async () => mockDb,
}));

describe('TransactionDetailScreen', () => {
  beforeEach(async () => {
    mockDismissTo.mockClear();
    mockDb = await createTestDatabase();
    await runMigrations(mockDb, migrations);
  });

  it('does not show the not-found notice after a successful delete', async () => {
    const cash = await createAccount(mockDb, { name: 'Cash', type: 'asset', currency: 'BRL' });
    const food = await createAccount(mockDb, { name: 'Food', type: 'expense', currency: 'BRL' });
    const tx = await createTransaction(mockDb, {
      date: '2026-02-01',
      description: 'Lunch',
      postings: [
        { accountId: cash.id, side: 'credit', amount: 1000, amountBrl: 1000 },
        { accountId: food.id, side: 'debit', amount: 1000, amountBrl: 1000 },
      ],
    });

    await render(<TransactionDetailScreen transactionId={tx.id} />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/transactions'));
    expect(screen.queryByText('Transaction not found')).toBeNull();
  });
});
