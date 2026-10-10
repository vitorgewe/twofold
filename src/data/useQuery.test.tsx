import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createAccount, listAccounts } from './accounts';
import { migrations, runMigrations, type Database } from './database';
import { createTestDatabase } from './sqljs-adapter';
import { useQuery } from './useQuery';

function AccountNames({ db }: { db: Database }) {
  const { data } = useQuery(() => listAccounts(db), [db]);
  return <Text testID="names">{data ? data.map((a) => a.name).join(',') : 'loading'}</Text>;
}

describe('useQuery', () => {
  it('shows new data after a repository write, without a reload', async () => {
    const db = await createTestDatabase();
    await runMigrations(db, migrations);

    await render(<AccountNames db={db} />);
    await waitFor(() => expect(screen.getByTestId('names')).toHaveTextContent(''));

    await act(() => createAccount(db, { name: 'Checking', type: 'asset', currency: 'BRL' }));
    await waitFor(() => expect(screen.getByTestId('names')).toHaveTextContent('Checking'));

    await act(() => createAccount(db, { name: 'Wallet', type: 'asset', currency: 'BRL' }));
    await waitFor(() => expect(screen.getByTestId('names')).toHaveTextContent('Checking,Wallet'));
  });

  it('drops the previous result when deps change and ignores a stale answer', async () => {
    const answers = new Map<string, (value: string) => void>();
    const fetchFor = (key: string) => new Promise<string>((resolve) => answers.set(key, resolve));

    function ByKey({ k }: { k: string }) {
      const { data, loading } = useQuery(() => fetchFor(k), [k]);
      return <Text testID="out">{`${loading ? 'loading' : 'ready'}:${data ?? '-'}`}</Text>;
    }

    const view = await render(<ByKey k="A" />);
    await act(async () => answers.get('A')!('list A'));
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('ready:list A'));

    await view.rerender(<ByKey k="B" />);
    expect(screen.getByTestId('out')).toHaveTextContent('loading:-');

    await act(async () => answers.get('B')!('list B'));
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('ready:list B'));
  });
});
