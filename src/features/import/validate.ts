import { ACCOUNT_TYPES, type AccountType } from '../ledger/account-types';
import { assertBalanced, type PostingSide } from '../ledger/balance';
import { BRL, currencyOf } from '../ledger/currency';
import { isIsoDate } from '../ledger/date';
import { parseAmount, parseRate, toBrl } from '../ledger/money';
import type { CsvRow } from './csv';

export type ExistingAccount = { type: AccountType; currency: string };

export type PlannedPosting = {
  /** Account name as written in the file. */
  account: string;
  side: PostingSide;
  amount: number;
  rate: number | null;
  amountBrl: number;
};

export type PlannedTransaction = {
  externalId: string;
  date: string;
  description: string;
  postings: PlannedPosting[];
};

export type AccountToCreate = { name: string; type: AccountType; currency: string };

export type ImportPlan = {
  errors: string[];
  accountsToCreate: AccountToCreate[];
  newTransactions: PlannedTransaction[];
  existingCount: number;
  /** Postings of the new transactions. */
  postingCount: number;
};

const MAX_ERRORS = 50;

const accountKey = (name: string): string => name.trim().toLowerCase();

type Group = { externalId: string; line: number; date: string; description: string; postings: PlannedPosting[]; ok: boolean };

/**
 * Checks parsed CSV rows against the accounts already in the database and the transactions already imported
 * (`existingIds`, matched by transaction_id). Pure: returns what would be written, and every problem found.
 * Existing transactions are validated like new ones, then left out of the plan.
 */
export function planImport(
  rows: readonly CsvRow[],
  existingAccounts: ReadonlyMap<string, ExistingAccount>,
  existingIds: ReadonlySet<string>,
): ImportPlan {
  const errors: string[] = [];
  // Set by every failure of the current row, so row validity does not depend on the error cap.
  let rowFailed = false;
  const fail = (line: number, message: string) => {
    rowFailed = true;
    if (errors.length < MAX_ERRORS) errors.push(`Line ${line}: ${message}`);
  };

  // What each account looks like in the file: one type and one currency throughout.
  const seen = new Map<string, { name: string; type: AccountType | null; currency: string | null }>();
  const groups = new Map<string, Group>();

  for (const row of rows) {
    rowFailed = false;
    if (!row.transaction_id) fail(row.line, 'transaction_id is empty.');
    if (!isIsoDate(row.date)) fail(row.line, `date "${row.date}" must be a real date as YYYY-MM-DD.`);
    if (!row.account) fail(row.line, 'account is empty.');
    if (row.side !== 'debit' && row.side !== 'credit') fail(row.line, `side "${row.side}" must be debit or credit.`);

    const currency = currencyOf(row.currency);
    if (!currency) fail(row.line, `currency "${row.currency}" is not supported.`);

    let type: AccountType | null = null;
    if (row.account_type) {
      if (ACCOUNT_TYPES.includes(row.account_type as AccountType)) type = row.account_type as AccountType;
      else fail(row.line, `account_type "${row.account_type}" must be one of ${ACCOUNT_TYPES.join(', ')}.`);
    }

    let amount = 0;
    let rate: number | null = null;
    let amountBrl = 0;
    if (currency) {
      try {
        amount = parseAmount(row.amount, currency);
      } catch (e) {
        fail(row.line, e instanceof Error ? e.message : String(e));
      }
      if (currency.code === BRL.code) {
        if (row.rate_to_brl) fail(row.line, 'rate_to_brl must be empty for BRL rows.');
        amountBrl = amount;
      } else if (!row.rate_to_brl) {
        fail(row.line, `rate_to_brl is required for ${currency.code} rows.`);
      } else {
        try {
          rate = parseRate(row.rate_to_brl);
          if (rate <= 0) fail(row.line, 'rate_to_brl must be greater than zero.');
          else amountBrl = toBrl(amount, currency, rate);
        } catch (e) {
          fail(row.line, e instanceof Error ? e.message : String(e));
        }
      }
    }

    if (row.account && currency) {
      const key = accountKey(row.account);
      const known = seen.get(key) ?? { name: row.account, type: null, currency: null };
      if (known.currency && known.currency !== currency.code) {
        fail(row.line, `account "${row.account}" is in ${known.currency} elsewhere in the file but ${currency.code} here.`);
      }
      if (type && known.type && known.type !== type) {
        fail(row.line, `account "${row.account}" is ${known.type} elsewhere in the file but ${type} here.`);
      }
      known.currency ??= currency.code;
      known.type ??= type;
      seen.set(key, known);
    }

    const rowOk = !rowFailed;
    const group = groups.get(row.transaction_id);
    if (!group) {
      groups.set(row.transaction_id, {
        externalId: row.transaction_id,
        line: row.line,
        date: row.date,
        description: row.description,
        postings: [],
        ok: rowOk,
      });
    } else {
      if (row.date !== group.date) fail(row.line, `date differs from line ${group.line} for the same transaction_id.`);
      if (row.description !== group.description) {
        fail(row.line, `description differs from line ${group.line} for the same transaction_id.`);
      }
      group.ok &&= !rowFailed;
    }
    if (rowOk && row.side && currency) {
      groups.get(row.transaction_id)!.postings.push({
        account: row.account,
        side: row.side as PostingSide,
        amount,
        rate,
        amountBrl,
      });
    }
  }

  // Accounts: the file must agree with what exists, and a new account needs a type.
  const toCreate = new Map<string, AccountToCreate>();
  const accountLine = (key: string) => rows.find((r) => accountKey(r.account) === key)?.line ?? 0;
  for (const [key, info] of seen) {
    const existing = existingAccounts.get(key);
    if (existing) {
      if (info.currency && existing.currency !== info.currency) {
        fail(accountLine(key), `account "${info.name}" exists in ${existing.currency}, the file uses ${info.currency}.`);
      }
      if (info.type && existing.type !== info.type) {
        fail(accountLine(key), `account "${info.name}" exists as ${existing.type}, the file says ${info.type}.`);
      }
    } else if (!info.type) {
      fail(accountLine(key), `account "${info.name}" does not exist yet, so account_type is required.`);
    } else if (info.currency) {
      toCreate.set(key, { name: info.name, type: info.type, currency: info.currency });
    }
  }

  const newTransactions: PlannedTransaction[] = [];
  let existingCount = 0;
  for (const group of groups.values()) {
    if (group.ok) {
      try {
        assertBalanced(group.postings.map((p) => ({ accountId: accountKey(p.account), side: p.side, amountBrl: p.amountBrl })));
      } catch (e) {
        const reason = e instanceof Error ? e.message.replace(/^Invalid transaction: /, '') : String(e);
        fail(group.line, `transaction ${group.externalId}: ${reason}.`);
        continue;
      }
    } else {
      continue;
    }
    if (existingIds.has(group.externalId)) existingCount++;
    else newTransactions.push({ externalId: group.externalId, date: group.date, description: group.description, postings: group.postings });
  }

  const used = new Set(newTransactions.flatMap((t) => t.postings.map((p) => accountKey(p.account))));
  return {
    errors,
    accountsToCreate: [...toCreate].filter(([key]) => used.has(key)).map(([, account]) => account),
    newTransactions,
    existingCount,
    postingCount: newTransactions.reduce((sum, t) => sum + t.postings.length, 0),
  };
}

export { accountKey };
