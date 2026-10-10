import { fireEvent, render, screen } from '@testing-library/react-native';

import { migrations, runMigrations, type Database } from '@/data/database';
import { addRate, listRates } from '@/data/rates';
import { createTestDatabase } from '@/data/sqljs-adapter';

import { todayIso } from './format';
import { RatesScreen } from './RatesScreen';

let mockDb: Database;

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, children),
}));
jest.mock('@/data/database', () => ({
  ...jest.requireActual('@/data/database'),
  getDatabase: async () => mockDb,
}));

const save = () => screen.getByRole('button', { name: 'Save rate' });

describe('RatesScreen', () => {
  beforeEach(async () => {
    mockDb = await createTestDatabase();
    await runMigrations(mockDb, migrations);
  });

  it('saves a rate, replaces one of the same day and shows it in the section', async () => {
    await render(<RatesScreen />);
    await fireEvent.changeText(screen.getByLabelText('BRL per unit'), '5.1234');
    await fireEvent.press(save());
    expect(await screen.findByText(/5\.1234 BRL per USD/)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('BRL per unit'), '5.20');
    await fireEvent.press(save());
    expect(await screen.findByText(/5\.20 BRL per USD/)).toBeTruthy();
    expect(screen.queryByText(/5\.1234/)).toBeNull();
    expect(await listRates(mockDb, 'USD')).toHaveLength(1);
  });

  it('shows the age of the latest rate', async () => {
    const now = new Date();
    const past = todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3));
    await addRate(mockDb, { currency: 'BTC', date: past, rate: 35_000_000_000_000 });
    await render(<RatesScreen />);
    expect(await screen.findByText(`${past} (3 days ago)`)).toBeTruthy();
  });

  it('rejects letters and more than 8 decimals', async () => {
    await render(<RatesScreen />);
    await fireEvent.changeText(screen.getByLabelText('BRL per unit'), 'abc');
    await fireEvent.press(save());
    expect(await screen.findByText(/up to 8 decimals/)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('BRL per unit'), '1.123456789');
    await fireEvent.press(save());
    expect(await screen.findByText(/up to 8 decimals/)).toBeTruthy();
    expect(await listRates(mockDb, 'USD')).toHaveLength(0);
  });
});
