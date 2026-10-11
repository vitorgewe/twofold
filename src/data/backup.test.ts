import { createAccount } from './accounts';
import { exportBackup, importBackup, markBackupDone } from './backup';
import { migrations, runMigrations } from './database';
import { getHomeSummary } from './home';
import { addRate } from './rates';
import { createTestDatabase } from './sqljs-adapter';
import { createTransaction, listTransactions } from './transactions';
import { parseBackup, serializeBackup } from '../features/backup/format';

async function seeded() {
  const db = await createTestDatabase();
  await runMigrations(db, migrations);
  const cash = await createAccount(db, { name: 'Cash', type: 'asset', currency: 'BRL' });
  const food = await createAccount(db, { name: 'Food', type: 'expense', currency: 'BRL' });
  const usd = await createAccount(db, { name: 'Dollars', type: 'asset', currency: 'USD' });
  await addRate(db, { currency: 'USD', date: '2026-10-01', rate: 520000000 });
  await createTransaction(db, {
    date: '2026-10-01',
    description: 'Lunch',
    postings: [
      { accountId: cash.id, side: 'credit', amount: 5200, amountBrl: 5200 },
      { accountId: usd.id, side: 'debit', amount: 1000, rate: 520000000, amountBrl: 5200 },
    ],
  });
  await createTransaction(db, {
    date: '2026-10-02',
    description: 'Snack',
    postings: [
      { accountId: cash.id, side: 'credit', amount: 700, amountBrl: 700 },
      { accountId: food.id, side: 'debit', amount: 700, amountBrl: 700 },
    ],
  });
  return db;
}

describe('backup', () => {
  it('restores into an empty database with the same net worth and transaction count', async () => {
    const source = await seeded();
    const text = serializeBackup(await exportBackup(source));
    const target = await createTestDatabase();
    await runMigrations(target, migrations);

    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(parsed.errors.join('; '));
    await importBackup(target, parsed.backup);

    const now = new Date('2026-10-11T12:00:00');
    expect((await getHomeSummary(target, now)).netWorth).toBe((await getHomeSummary(source, now)).netWorth);
    expect(await listTransactions(target)).toEqual(await listTransactions(source));
    expect(await exportBackup(target, new Date(0))).toEqual({
      ...(await exportBackup(source, new Date(0))),
    });
  });

  it('replaces existing data', async () => {
    const source = await seeded();
    const target = await seeded();
    await createAccount(target, { name: 'Extra', type: 'asset', currency: 'BRL' });
    await importBackup(target, (await exportBackup(source)));
    expect((await target.query('SELECT id FROM account')).length).toBe(3);
  });

  it('leaves the data unchanged when the database rejects the import', async () => {
    const source = await seeded();
    const target = await seeded();
    const before = await exportBackup(target, new Date(0));
    const backup = await exportBackup(source);
    // two active accounts with one name violate the unique index, after earlier rows were already replaced
    backup.accounts[1] = { ...backup.accounts[1], name: backup.accounts[0].name };
    await expect(importBackup(target, backup)).rejects.toThrow();
    expect(await exportBackup(target, new Date(0))).toEqual(before);
  });

  it('marks the backup so Home reads "today"', async () => {
    const db = await seeded();
    const now = new Date('2026-10-11T12:00:00Z');
    expect((await getHomeSummary(db, now)).backup).toEqual({ kind: 'none' });
    await markBackupDone(db, now);
    expect((await getHomeSummary(db, now)).backup).toEqual({ kind: 'recent', days: 0 });
  });
});
