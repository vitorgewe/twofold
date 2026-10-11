import { fireEvent, render, screen } from '@testing-library/react-native';

import { migrations, runMigrations, type Database } from '@/data/database';
import { createTestDatabase } from '@/data/sqljs-adapter';

import { ResultScreen } from './ResultScreen';

let mockDb: Database;

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, children),
}));
jest.mock('@/data/database', () => ({
  ...jest.requireActual('@/data/database'),
  getDatabase: async () => mockDb,
}));

describe('ResultScreen', () => {
  beforeEach(async () => {
    mockDb = await createTestDatabase();
    await runMigrations(mockDb, migrations);
  });

  it('shows the empty state for a period without movements', async () => {
    await render(<ResultScreen />);
    expect(await screen.findByText('No movements in this period')).toBeTruthy();
  });

  it('asks for valid dates in a custom range', async () => {
    await render(<ResultScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Custom' }));
    await fireEvent.changeText(screen.getByLabelText('From'), 'nope');
    expect(await screen.findByText('Enter both dates as YYYY-MM-DD.')).toBeTruthy();
  });

  it('reports a reversed custom range instead of an empty period', async () => {
    await render(<ResultScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Custom' }));
    await fireEvent.changeText(screen.getByLabelText('From'), '2026-10-31');
    await fireEvent.changeText(screen.getByLabelText('To'), '2026-10-01');
    expect(await screen.findByText('The start date must not be after the end date.')).toBeTruthy();
    expect(screen.queryByText('No movements in this period')).toBeNull();
  });
});
