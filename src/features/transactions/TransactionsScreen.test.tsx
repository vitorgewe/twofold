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

  it('says so when a typed date is not a full ISO date', async () => {
    await render(<TransactionsScreen />);
    await fireEvent.changeText(screen.getByLabelText('From'), '2026-1');
    expect(screen.getByText('Enter the date as YYYY-MM-DD.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('From'), '2026-01-01');
    expect(screen.queryByText('Enter the date as YYYY-MM-DD.')).toBeNull();
  });

  it('says so when the range is reversed, instead of the no-match notice', async () => {
    await render(<TransactionsScreen />);
    await fireEvent.changeText(screen.getByLabelText('From'), '2026-03-01');
    await fireEvent.changeText(screen.getByLabelText('To'), '2026-02-01');
    expect(screen.getByText('The start date must not be after the end date.')).toBeTruthy();
    expect(screen.queryByText('No matching transactions')).toBeNull();
  });
});
