import { fireEvent, render, screen } from '@testing-library/react-native';

import { migrations, runMigrations, type Database } from '@/data/database';
import { createTestDatabase } from '@/data/sqljs-adapter';

import { TransactionsScreen } from './TransactionsScreen';

let mockDb: Database;

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, children),
}));
jest.mock('@/data/database', () => ({
  ...jest.requireActual('@/data/database'),
  getDatabase: async () => mockDb,
}));

describe('TransactionsScreen', () => {
  beforeEach(async () => {
    mockDb = await createTestDatabase();
    await runMigrations(mockDb, migrations);
  });

  it('keeps the other bound of a preset when one date is typed', async () => {
    await render(<TransactionsScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'This month' }));
    const to = screen.getByLabelText('To').props.value;
    expect(to).not.toBe('');

    await fireEvent.changeText(screen.getByLabelText('From'), '2026-01-01');
    expect(screen.getByLabelText('From').props.value).toBe('2026-01-01');
    expect(screen.getByLabelText('To').props.value).toBe(to);
  });
});
