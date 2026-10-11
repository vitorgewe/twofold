import { ACCOUNT_TYPES, type AccountType } from '../ledger/account-types';
import { assertBalanced, type PostingSide } from '../ledger/balance';
import { BRL, currencyOf } from '../ledger/currency';
import { isIsoDate } from '../ledger/date';
import { toBrl } from '../ledger/money';

export const FORMAT_VERSION = 1;

export type BackupCurrency = { code: string; name: string; decimals: number };
export type BackupAccount = { id: string; name: string; type: AccountType; currency: string; archived: boolean };
/** `external_id` is the CSV transaction_id, kept so a restored database still skips already imported rows. */
export type BackupTransaction = { id: string; date: string; description: string; external_id?: string | null };
export type BackupPosting = {
  id: string;
  transaction_id: string;
  account_id: string;
  side: PostingSide;
  amount: number;
  rate: number | null;
  amount_brl: number;
};
export type BackupRate = { currency: string; date: string; rate_scaled: number };

export type Backup = {
  format_version: number;
  exported_at: string;
  currencies: BackupCurrency[];
  accounts: BackupAccount[];
  transactions: BackupTransaction[];
  postings: BackupPosting[];
  rates: BackupRate[];
};

export type BackupCounts = { accounts: number; transactions: number; postings: number; rates: number };

export type BackupValidation = { ok: true; backup: Backup; counts: BackupCounts } | { ok: false; errors: string[] };

export const backupFileName = (now: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `twofold-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
};

export const serializeBackup = (backup: Backup): string => JSON.stringify(backup, null, 2);

const MAX_ERRORS = 20;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

/**
 * Checks parsed backup JSON without touching the database: version, shape, references between records and
 * that every transaction balances. Returns every problem found (up to a limit), not only the first.
 */
export function validateBackup(input: unknown): BackupValidation {
  const errors: string[] = [];
  const fail = (message: string) => {
    if (errors.length < MAX_ERRORS) errors.push(message);
  };

  if (!isObj(input)) return { ok: false, errors: ['The file is not a Twofold backup.'] };
  if (input.format_version !== FORMAT_VERSION) {
    return {
      ok: false,
      errors: [`Unsupported format_version ${JSON.stringify(input.format_version)}; this app reads version ${FORMAT_VERSION}.`],
    };
  }

  const table = (name: string): Obj[] => {
    const value = input[name];
    if (!Array.isArray(value)) {
      fail(`"${name}" must be a list.`);
      return [];
    }
    return value.map((row, i) => {
      if (!isObj(row)) {
        fail(`${name}[${i}] must be an object.`);
        return {};
      }
      return row;
    });
  };
  if (!isStr(input.exported_at) || Number.isNaN(Date.parse(input.exported_at))) fail('"exported_at" must be a timestamp.');

  const currencies = new Map<string, BackupCurrency>();
  table('currencies').forEach((row, i) => {
    if (!isStr(row.code) || !isStr(row.name) || !isInt(row.decimals) || row.decimals < 0) {
      return fail(`currencies[${i}] is malformed.`);
    }
    if (currencies.has(row.code)) return fail(`Duplicate currency ${row.code}.`);
    currencies.set(row.code, { code: row.code, name: row.name, decimals: row.decimals });
  });

  if (!currencies.has(BRL.code)) fail(`The currency ${BRL.code} is missing.`);

  const accounts = new Map<string, BackupAccount>();
  const activeNames = new Set<string>();
  table('accounts').forEach((row, i) => {
    if (
      !isStr(row.id) || !isStr(row.name) || !isStr(row.currency) ||
      !ACCOUNT_TYPES.includes(row.type as AccountType) || typeof row.archived !== 'boolean'
    ) {
      return fail(`accounts[${i}] is malformed.`);
    }
    if (accounts.has(row.id)) return fail(`Duplicate account id ${row.id}.`);
    if (!currencies.has(row.currency)) return fail(`Account "${row.name}" uses unknown currency ${row.currency}.`);
    if (!row.archived) {
      const key = row.name.toLowerCase();
      if (activeNames.has(key)) return fail(`Two active accounts are named "${row.name}" (names ignore case).`);
      activeNames.add(key);
    }
    accounts.set(row.id, row as unknown as BackupAccount);
  });

  const transactions = new Map<string, BackupTransaction>();
  const externalIds = new Set<string>();
  table('transactions').forEach((row, i) => {
    const externalOk = row.external_id === undefined || row.external_id === null || isStr(row.external_id);
    if (!isStr(row.id) || typeof row.description !== 'string' || !isStr(row.date) || !isIsoDate(row.date) || !externalOk) {
      return fail(`transactions[${i}] is malformed.`);
    }
    if (transactions.has(row.id)) return fail(`Duplicate transaction id ${row.id}.`);
    if (typeof row.external_id === 'string') {
      if (externalIds.has(row.external_id)) return fail(`Duplicate external_id ${row.external_id}.`);
      externalIds.add(row.external_id);
    }
    transactions.set(row.id, row as unknown as BackupTransaction);
  });

  const postings: BackupPosting[] = [];
  const postingIds = new Set<string>();
  const byTransaction = new Map<string, BackupPosting[]>();
  table('postings').forEach((row, i) => {
    if (
      !isStr(row.id) || !isStr(row.transaction_id) || !isStr(row.account_id) ||
      (row.side !== 'debit' && row.side !== 'credit') ||
      !isInt(row.amount) || row.amount < 0 || !isInt(row.amount_brl) || row.amount_brl < 0 ||
      !(row.rate === null || (isInt(row.rate) && row.rate > 0))
    ) {
      return fail(`postings[${i}] is malformed.`);
    }
    if (postingIds.has(row.id)) return fail(`Duplicate posting id ${row.id}.`);
    postingIds.add(row.id);
    const account = accounts.get(row.account_id);
    if (!transactions.has(row.transaction_id)) return fail(`Posting ${row.id} points to a missing transaction.`);
    if (!account) return fail(`Posting ${row.id} points to a missing account.`);
    const posting = row as unknown as BackupPosting;
    const currency = currencyOf(account.currency);
    if (account.currency === BRL.code) {
      if (posting.amount !== posting.amount_brl || posting.rate !== null) {
        return fail(`Posting ${row.id} on a BRL account must have amount equal to its BRL value and no rate.`);
      }
    } else if (posting.amount > 0 && currency) {
      if (posting.rate === null || Math.abs(posting.amount_brl - toBrl(posting.amount, currency, posting.rate)) > 1) {
        return fail(`Posting ${row.id} has a BRL value that does not match amount times rate.`);
      }
    }
    postings.push(posting);
    byTransaction.set(posting.transaction_id, [...(byTransaction.get(posting.transaction_id) ?? []), posting]);
  });

  for (const t of transactions.values()) {
    try {
      assertBalanced(
        (byTransaction.get(t.id) ?? []).map((p) => ({ accountId: p.account_id, side: p.side, amountBrl: p.amount_brl })),
      );
    } catch (e) {
      fail(`Transaction "${t.description}" (${t.date}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const rates: BackupRate[] = [];
  const rateKeys = new Set<string>();
  table('rates').forEach((row, i) => {
    if (!isStr(row.currency) || !isStr(row.date) || !isIsoDate(row.date) || !isInt(row.rate_scaled) || row.rate_scaled <= 0) {
      return fail(`rates[${i}] is malformed.`);
    }
    if (!currencies.has(row.currency)) return fail(`Rate for unknown currency ${row.currency}.`);
    const key = `${row.currency}|${row.date}`;
    if (rateKeys.has(key)) return fail(`Duplicate rate for ${row.currency} on ${row.date}.`);
    rateKeys.add(key);
    rates.push(row as unknown as BackupRate);
  });

  if (errors.length > 0) return { ok: false, errors };

  const backup: Backup = {
    format_version: FORMAT_VERSION,
    exported_at: input.exported_at as string,
    currencies: [...currencies.values()],
    accounts: [...accounts.values()],
    transactions: [...transactions.values()],
    postings,
    rates,
  };
  return {
    ok: true,
    backup,
    counts: {
      accounts: accounts.size,
      transactions: transactions.size,
      postings: postings.length,
      rates: rates.length,
    },
  };
}

/** Parses the text of a backup file and validates it. */
export function parseBackup(text: string): BackupValidation {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  return validateBackup(json);
}
