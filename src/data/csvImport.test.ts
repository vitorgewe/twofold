import { readFileSync } from 'node:fs';

import { parseBackup, serializeBackup } from '../features/backup/format';
import { parseCsv } from '../features/import/csv';
import { netWorth } from '../features/ledger/reports';
import { listAccounts } from './accounts';
import { exportBackup, importBackup } from './backup';
import { applyCsvImport, previewCsvImport } from './csvImport';
import { migrations, runMigrations, type Database } from './database';
import { createTestDatabase } from './sqljs-adapter';
import { listReportPostings, listTransactions } from './transactions';

const fixture = (name: string) => readFileSync(`${__dirname}/../../e2e/fixtures/${name}`, 'utf8');

async function empty() {
  const db = await createTestDatabase();
  await runMigrations(db, migrations);
  return db;
}

async function plan(db: Database, text: string) {
  const parsed = parseCsv(text);
  if (!parsed.ok) throw new Error(parsed.errors.join('; '));
  return previewCsvImport(db, parsed.rows);
}

const worth = async (db: Database) => netWorth(await listAccounts(db), await listReportPostings(db));

describe('CSV import', () => {
  it('imports the spec example, then reports it as existing and changes nothing', async () => {
    const db = await empty();
    const first = await plan(db, fixture('example.csv'));
    expect(first.errors).toEqual([]);
    expect(first.accountsToCreate).toHaveLength(3);
    expect(first.newTransactions).toHaveLength(2);
    await applyCsvImport(db, first);
    expect(await worth(db)).toBe(-30000);
    expect(await listTransactions(db)).toHaveLength(2);

    const second = await plan(db, fixture('example.csv'));
    expect(second.newTransactions).toHaveLength(0);
    expect(second.existingCount).toBe(2);
    expect(second.accountsToCreate).toHaveLength(0);
    await applyCsvImport(db, second);
    expect(await worth(db)).toBe(-30000);
    expect(await listTransactions(db)).toHaveLength(2);
  });

  it('keeps a comma inside a quoted description and imports one credit with three debits', async () => {
    const db = await empty();
    await applyCsvImport(db, await plan(db, fixture('split.csv')));
    const [transaction] = await listTransactions(db);
    expect(transaction.description).toBe('Dinner, drinks and tip');
    expect(transaction.postings).toHaveLength(4);
  });

  it('still skips imported transactions after a backup restore', async () => {
    const source = await empty();
    await applyCsvImport(source, await plan(source, fixture('example.csv')));
    const restored = parseBackup(serializeBackup(await exportBackup(source)));
    if (!restored.ok) throw new Error(restored.errors.join('; '));
    const target = await empty();
    await importBackup(target, restored.backup);
    const again = await plan(target, fixture('example.csv'));
    expect(again.newTransactions).toHaveLength(0);
    expect(again.existingCount).toBe(2);
  });

  it('writes nothing when a transaction lost a row', async () => {
    const db = await empty();
    const lines = fixture('example.csv').trimEnd().split('\n');
    const result = await plan(db, lines.slice(0, 4).join('\n'));
    expect(result.errors).toHaveLength(1);
    await expect(applyCsvImport(db, result)).rejects.toThrow();
    expect(await listTransactions(db)).toHaveLength(0);
    expect(await listAccounts(db)).toHaveLength(0);
  });

  it('rolls everything back when a write fails midway', async () => {
    const db = await empty();
    const result = await plan(db, fixture('example.csv'));
    // A rate-less BRL posting for a foreign account fails createTransaction's own validation on the second transaction.
    result.newTransactions[1].postings[0].rate = null;
    await expect(applyCsvImport(db, result)).rejects.toThrow();
    expect(await listTransactions(db)).toHaveLength(0);
    expect(await listAccounts(db)).toHaveLength(0);
  });
});
