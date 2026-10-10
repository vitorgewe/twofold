import { ACCOUNT_TYPES, type Account, type AccountType } from '../features/ledger/account-types';
import type { PostingSide } from '../features/ledger/balance';
import { direction } from '../features/ledger/reports';
import type { Database } from './database';
import { newId } from './ids';

export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

type AccountRow = Omit<Account, 'archived'> & { archived: number };

const toAccount = (row: AccountRow): Account => ({ ...row, archived: row.archived === 1 });

const cleanName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) throw new AccountError('Account name cannot be empty');
  return trimmed;
};

async function requireAccount(db: Database, id: string): Promise<Account> {
  const rows = await db.query<AccountRow>(
    'SELECT id, name, type, currency, archived FROM account WHERE id = ?',
    [id],
  );
  if (!rows[0]) throw new AccountError(`Account not found: ${id}`);
  return toAccount(rows[0]);
}

async function assertNameFree(db: Database, name: string, exceptId: string | null): Promise<void> {
  const rows = await db.query(
    'SELECT id FROM account WHERE archived = 0 AND lower(name) = lower(?) AND id <> ?',
    [name, exceptId ?? ''],
  );
  if (rows.length > 0) throw new AccountError(`An active account named "${name}" already exists`);
}

export async function createAccount(
  db: Database,
  input: { name: string; type: AccountType; currency: string },
): Promise<Account> {
  const name = cleanName(input.name);
  if (!ACCOUNT_TYPES.includes(input.type)) throw new AccountError(`Unknown account type: ${input.type}`);
  const currencies = await db.query('SELECT code FROM currency WHERE code = ?', [input.currency]);
  if (currencies.length === 0) throw new AccountError(`Unknown currency: ${input.currency}`);
  await assertNameFree(db, name, null);

  const id = newId();
  await db.run('INSERT INTO account (id, name, type, currency, archived) VALUES (?, ?, ?, ?, 0)', [
    id,
    name,
    input.type,
    input.currency,
  ]);
  return { id, name, type: input.type, currency: input.currency, archived: false };
}

export async function renameAccount(db: Database, id: string, newName: string): Promise<void> {
  const name = cleanName(newName);
  const account = await requireAccount(db, id);
  if (!account.archived) await assertNameFree(db, name, id);
  await db.run('UPDATE account SET name = ? WHERE id = ?', [name, id]);
}

export async function archiveAccount(db: Database, id: string): Promise<void> {
  const account = await requireAccount(db, id);
  const postings = await db.query<{ side: PostingSide; amount: number; amount_brl: number }>(
    'SELECT side, amount, amount_brl FROM postings WHERE account_id = ?',
    [id],
  );
  const signed = (value: (p: (typeof postings)[number]) => number) =>
    postings.reduce((sum, p) => sum + direction(account.type, p.side) * value(p), 0);
  const holds = signed((p) => p.amount) !== 0 || signed((p) => p.amount_brl) !== 0;
  if (holds) throw new AccountError(`Account "${account.name}" still has a balance; empty it before archiving`);
  await db.run('UPDATE account SET archived = 1 WHERE id = ?', [id]);
}

export async function unarchiveAccount(db: Database, id: string): Promise<void> {
  const account = await requireAccount(db, id);
  await assertNameFree(db, account.name, id);
  await db.run('UPDATE account SET archived = 0 WHERE id = ?', [id]);
}

export async function getAccount(db: Database, id: string): Promise<Account | null> {
  const rows = await db.query<AccountRow>(
    'SELECT id, name, type, currency, archived FROM account WHERE id = ?',
    [id],
  );
  return rows[0] ? toAccount(rows[0]) : null;
}

export async function listAccounts(
  db: Database,
  options: { includeArchived?: boolean } = {},
): Promise<Account[]> {
  const where = options.includeArchived ? '' : 'WHERE archived = 0';
  const rows = await db.query<AccountRow>(
    `SELECT id, name, type, currency, archived FROM account ${where} ORDER BY lower(name), id`,
  );
  return rows.map(toAccount);
}
