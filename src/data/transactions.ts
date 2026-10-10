import type { Account } from '../features/ledger/account-types';
import { assertBalanced, InvalidTransactionError, type PostingSide } from '../features/ledger/balance';
import { BRL } from '../features/ledger/currency';
import { isIsoDate } from '../features/ledger/date';
import { accountBalances, type AccountBalance, type ReportPosting } from '../features/ledger/reports';
import { listAccounts } from './accounts';
import { notifyDataChanged } from './changes';
import { getDatabase, type Database, type SqlValue } from './database';
import { newId } from './ids';
import { useQuery, type QueryState } from './useQuery';

export type PostingInput = {
  accountId: string;
  side: PostingSide;
  /** Minor units of the account's currency. */
  amount: number;
  /** BRL price scaled by RATE_SCALE; absent for BRL accounts. */
  rate?: number | null;
  /** Centavos. */
  amountBrl: number;
};

export type Posting = {
  id: string;
  transactionId: string;
  accountId: string;
  side: PostingSide;
  amount: number;
  rate: number | null;
  amountBrl: number;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  postings: Posting[];
};

export type TransactionInput = {
  date: string;
  description: string;
  postings: PostingInput[];
};

export type TransactionFilter = { from?: string; to?: string; accountId?: string };

export type AccountWithBalance = Account & AccountBalance;

type PostingRow = {
  id: string;
  transaction_id: string;
  account_id: string;
  side: PostingSide;
  amount: number;
  rate: number | null;
  amount_brl: number;
};

const POSTING_COLUMNS = 'p.id, p.transaction_id, p.account_id, p.side, p.amount, p.rate, p.amount_brl';

const toPosting = (row: PostingRow): Posting => ({
  id: row.id,
  transactionId: row.transaction_id,
  accountId: row.account_id,
  side: row.side,
  amount: row.amount,
  rate: row.rate,
  amountBrl: row.amount_brl,
});

/** Checks every posting against its account and the money rules; assertBalanced covers the sums. */
async function validate(db: Database, input: TransactionInput): Promise<void> {
  if (!isIsoDate(input.date)) throw new InvalidTransactionError(`date must be YYYY-MM-DD, got "${input.date}"`);

  const ids = [...new Set(input.postings.map((p) => p.accountId))];
  const found = await db.query<{ id: string; currency: string; archived: number }>(
    `SELECT id, currency, archived FROM account WHERE id IN (${ids.map(() => '?').join(', ')})`,
    ids,
  );
  const accounts = new Map(found.map((row) => [row.id, row]));
  for (const id of ids) if (!accounts.has(id)) throw new InvalidTransactionError(`account not found: ${id}`);

  for (const p of input.postings) {
    const account = accounts.get(p.accountId)!;
    if (account.archived === 1) throw new InvalidTransactionError(`account ${p.accountId} is archived`);
    if (!Number.isSafeInteger(p.amount) || p.amount < 0) {
      throw new InvalidTransactionError('amounts must be non-negative safe integers');
    }
    const hasRate = p.rate !== undefined && p.rate !== null;
    if (account.currency === BRL.code) {
      if (p.amount !== p.amountBrl) throw new InvalidTransactionError('a BRL posting must have amount equal to its BRL value');
      if (hasRate) throw new InvalidTransactionError('a BRL posting cannot have a rate');
    } else if (p.amount > 0) {
      if (!hasRate || !Number.isSafeInteger(p.rate) || (p.rate as number) <= 0) {
        throw new InvalidTransactionError('a foreign-currency posting needs a positive rate');
      }
    } else if (p.amountBrl <= 0) {
      throw new InvalidTransactionError('a zero-amount foreign-currency posting must be a value adjustment with a positive BRL amount');
    }
  }
}

async function insertPostings(db: Database, transactionId: string, postings: PostingInput[]): Promise<void> {
  for (const p of postings) {
    await db.run(
      'INSERT INTO postings (id, transaction_id, account_id, side, amount, rate, amount_brl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId(), transactionId, p.accountId, p.side, p.amount, p.rate ?? null, p.amountBrl],
    );
  }
}

function checkAndStore(db: Database, input: TransactionInput, store: () => Promise<void>): Promise<void> {
  return db.transaction(async () => {
    assertBalanced(input.postings);
    await validate(db, input);
    await store();
  });
}

export async function createTransaction(db: Database, input: TransactionInput): Promise<Transaction> {
  const id = newId();
  await checkAndStore(db, input, async () => {
    await db.run('INSERT INTO transactions (id, date, description) VALUES (?, ?, ?)', [id, input.date, input.description]);
    await insertPostings(db, id, input.postings);
  });
  notifyDataChanged();
  return (await getTransaction(db, id))!;
}

/** Replaces the date, description and every posting of an existing transaction. */
export async function updateTransaction(db: Database, id: string, input: TransactionInput): Promise<Transaction> {
  await checkAndStore(db, input, async () => {
    const existing = await db.query('SELECT id FROM transactions WHERE id = ?', [id]);
    if (existing.length === 0) throw new InvalidTransactionError(`transaction not found: ${id}`);
    await db.run('UPDATE transactions SET date = ?, description = ? WHERE id = ?', [input.date, input.description, id]);
    await db.run('DELETE FROM postings WHERE transaction_id = ?', [id]);
    await insertPostings(db, id, input.postings);
  });
  notifyDataChanged();
  return (await getTransaction(db, id))!;
}

export async function deleteTransaction(db: Database, id: string): Promise<void> {
  await db.transaction(async () => {
    await db.run('DELETE FROM postings WHERE transaction_id = ?', [id]);
    await db.run('DELETE FROM transactions WHERE id = ?', [id]);
  });
  notifyDataChanged();
}

/** The WHERE clause (over alias t) that selected the transaction rows, reused to select their postings. */
type Scope = { clause: string; params: SqlValue[] };

async function withPostings(
  db: Database,
  rows: { id: string; date: string; description: string }[],
  scope: Scope,
): Promise<Transaction[]> {
  if (rows.length === 0) return [];
  const byTransaction = new Map<string, Posting[]>();
  const postings = await db.query<PostingRow>(
    `SELECT ${POSTING_COLUMNS} FROM postings p
     WHERE p.transaction_id IN (SELECT t.id FROM transactions t ${scope.clause}) ORDER BY p.rowid`,
    scope.params,
  );
  for (const row of postings) {
    const list = byTransaction.get(row.transaction_id) ?? [];
    list.push(toPosting(row));
    byTransaction.set(row.transaction_id, list);
  }
  return rows.map((r) => ({ ...r, postings: byTransaction.get(r.id) ?? [] }));
}

export async function getTransaction(db: Database, id: string): Promise<Transaction | null> {
  const rows = await db.query<{ id: string; date: string; description: string }>(
    'SELECT id, date, description FROM transactions WHERE id = ?',
    [id],
  );
  return (await withPostings(db, rows, { clause: 'WHERE t.id = ?', params: [id] }))[0] ?? null;
}

/** Newest first; from and to are inclusive dates; accountId keeps transactions that touch that account. */
export async function listTransactions(db: Database, filter: TransactionFilter = {}): Promise<Transaction[]> {
  const where: string[] = [];
  const params: SqlValue[] = [];
  if (filter.from) {
    where.push('t.date >= ?');
    params.push(filter.from);
  }
  if (filter.to) {
    where.push('t.date <= ?');
    params.push(filter.to);
  }
  if (filter.accountId) {
    where.push('EXISTS (SELECT 1 FROM postings x WHERE x.transaction_id = t.id AND x.account_id = ?)');
    params.push(filter.accountId);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query<{ id: string; date: string; description: string }>(
    `SELECT t.id, t.date, t.description FROM transactions t ${clause} ORDER BY t.date DESC, t.rowid DESC`,
    params,
  );
  return withPostings(db, rows, { clause, params });
}

/** Postings of one account with their transaction date, oldest first. */
export async function listPostingsForAccount(db: Database, accountId: string): Promise<(Posting & { date: string })[]> {
  const rows = await db.query<PostingRow & { date: string }>(
    `SELECT ${POSTING_COLUMNS}, t.date FROM postings p JOIN transactions t ON t.id = p.transaction_id
     WHERE p.account_id = ? ORDER BY t.date, p.rowid`,
    [accountId],
  );
  return rows.map((r) => ({ ...toPosting(r), date: r.date }));
}

/** Every posting with its date, in the shape the reports take. */
export async function listReportPostings(db: Database): Promise<ReportPosting[]> {
  const rows = await db.query<PostingRow & { date: string }>(
    `SELECT ${POSTING_COLUMNS}, t.date FROM postings p JOIN transactions t ON t.id = p.transaction_id`,
  );
  return rows.map((r) => ({
    accountId: r.account_id,
    side: r.side,
    amount: r.amount,
    amountBrl: r.amount_brl,
    date: r.date,
  }));
}

export async function listAccountsWithBalances(db: Database): Promise<AccountWithBalance[]> {
  const accounts = await listAccounts(db);
  const balances = accountBalances(accounts, await listReportPostings(db));
  const byId = new Map(balances.map((b) => [b.accountId, b]));
  return accounts.map((a) => ({ ...a, ...byId.get(a.id)! }));
}

export function useTransactions(filter: TransactionFilter = {}): QueryState<Transaction[]> {
  return useQuery(async () => listTransactions(await getDatabase(), filter), [
    filter.from,
    filter.to,
    filter.accountId,
  ]);
}

export function useAccountsWithBalances(): QueryState<AccountWithBalance[]> {
  return useQuery(async () => listAccountsWithBalances(await getDatabase()));
}
