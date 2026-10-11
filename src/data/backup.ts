import { FORMAT_VERSION, type Backup } from '../features/backup/format';
import type { Database } from './database';
import { LAST_BACKUP_KEY } from './home';
import { setMeta } from './meta';

type AccountRow = { id: string; name: string; type: Backup['accounts'][number]['type']; currency: string; archived: number };

/** Reads every table into the backup format. */
export async function exportBackup(db: Database, now: Date = new Date()): Promise<Backup> {
  // One transaction, so a write landing mid-export cannot leave postings without their transaction.
  return db.transaction(async (tx) => {
    const accounts = await tx.query<AccountRow>('SELECT id, name, type, currency, archived FROM account ORDER BY rowid');
    return {
      format_version: FORMAT_VERSION,
      exported_at: now.toISOString(),
      currencies: await tx.query<Backup['currencies'][number]>('SELECT code, name, decimals FROM currency ORDER BY code'),
      accounts: accounts.map((a) => ({ ...a, archived: a.archived === 1 })),
      transactions: await tx.query<Backup['transactions'][number]>(
        'SELECT id, date, description, external_id FROM transactions ORDER BY rowid',
      ),
      postings: await tx.query<Backup['postings'][number]>(
        'SELECT id, transaction_id, account_id, side, amount, rate, amount_brl FROM postings ORDER BY rowid',
      ),
      rates: await tx.query<Backup['rates'][number]>('SELECT currency, date, rate_scaled FROM rate ORDER BY currency, date'),
    };
  });
}

/** Records that a backup was saved; Home reads it. Call only after the file was handed to the user. */
export const markBackupDone = (db: Database, now: Date = new Date()): Promise<void> =>
  setMeta(db, LAST_BACKUP_KEY, now.toISOString());

/** Replaces all data with a validated backup in one transaction; on any error nothing changes. */
export async function importBackup(db: Database, backup: Backup): Promise<void> {
  await db.transaction(async (tx) => {
    for (const table of ['postings', 'transactions', 'rate', 'account', 'currency']) {
      await tx.run(`DELETE FROM ${table}`);
    }
    for (const c of backup.currencies) {
      await tx.run('INSERT INTO currency (code, name, decimals) VALUES (?, ?, ?)', [c.code, c.name, c.decimals]);
    }
    for (const a of backup.accounts) {
      await tx.run('INSERT INTO account (id, name, type, currency, archived) VALUES (?, ?, ?, ?, ?)', [
        a.id,
        a.name,
        a.type,
        a.currency,
        a.archived ? 1 : 0,
      ]);
    }
    for (const t of backup.transactions) {
      await tx.run('INSERT INTO transactions (id, date, description, external_id) VALUES (?, ?, ?, ?)', [
        t.id,
        t.date,
        t.description,
        t.external_id ?? null,
      ]);
    }
    for (const p of backup.postings) {
      await tx.run(
        'INSERT INTO postings (id, transaction_id, account_id, side, amount, rate, amount_brl) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.transaction_id, p.account_id, p.side, p.amount, p.rate, p.amount_brl],
      );
    }
    for (const r of backup.rates) {
      await tx.run('INSERT INTO rate (currency, date, rate_scaled) VALUES (?, ?, ?)', [r.currency, r.date, r.rate_scaled]);
    }
  });
}
