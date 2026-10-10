import type { Account, AccountType } from './account-types';
import type { PostingSide } from './balance';

/** A stored posting joined with its transaction date (YYYY-MM-DD). */
export type ReportPosting = {
  accountId: string;
  side: PostingSide;
  amount: number;
  amountBrl: number;
  date: string;
};

export type AccountBalance = {
  accountId: string;
  native: number;
  brl: number;
};

export type StatementLine = {
  accountId: string;
  name: string;
  brl: number;
};

export type IncomeStatement = {
  income: StatementLine[];
  expenses: StatementLine[];
  totalIncome: number;
  totalExpenses: number;
  result: number;
};

const DEBIT_NORMAL: ReadonlySet<AccountType> = new Set<AccountType>(['asset', 'expense']);

/** +1 when a posting on this account type increases its balance, -1 when it decreases it. */
function direction(type: AccountType, side: PostingSide): number {
  return (side === 'debit') === DEBIT_NORMAL.has(type) ? 1 : -1;
}

/** Balance per account, in the account's currency and in BRL. Accounts without postings appear with zeros. */
export function accountBalances(
  accounts: readonly Account[],
  postings: readonly ReportPosting[],
): AccountBalance[] {
  const byId = new Map<string, AccountBalance>();
  for (const account of accounts) byId.set(account.id, { accountId: account.id, native: 0, brl: 0 });
  const types = new Map(accounts.map((a) => [a.id, a.type]));

  for (const posting of postings) {
    const type = types.get(posting.accountId);
    const balance = byId.get(posting.accountId);
    if (!type || !balance) continue;
    const sign = direction(type, posting.side);
    balance.native += sign * posting.amount;
    balance.brl += sign * posting.amountBrl;
  }
  return [...byId.values()];
}

/** Assets minus liabilities, from ledger BRL values only. */
export function netWorth(accounts: readonly Account[], postings: readonly ReportPosting[]): number {
  const types = new Map(accounts.map((a) => [a.id, a.type]));
  let total = 0;
  for (const balance of accountBalances(accounts, postings)) {
    const type = types.get(balance.accountId);
    if (type === 'asset') total += balance.brl;
    else if (type === 'liability') total -= balance.brl;
  }
  return total;
}

/** Native balances per currency code: assets minus liabilities, so a debt counts as negative. */
export function balancesByCurrency(
  accounts: readonly Account[],
  postings: readonly ReportPosting[],
): Record<string, number> {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const totals: Record<string, number> = {};
  for (const balance of accountBalances(accounts, postings)) {
    const account = byId.get(balance.accountId);
    if (!account || (account.type !== 'asset' && account.type !== 'liability')) continue;
    const signed = account.type === 'asset' ? balance.native : -balance.native;
    totals[account.currency] = (totals[account.currency] ?? 0) + signed;
  }
  return totals;
}

/** Income and expense lines for postings dated within from..to, both inclusive. */
export function incomeStatement(
  postings: readonly ReportPosting[],
  accounts: readonly Account[],
  period: { from: string; to: string },
): IncomeStatement {
  const inPeriod = postings.filter((p) => p.date >= period.from && p.date <= period.to);
  const nameOf = new Map(accounts.map((a) => [a.id, a.name]));

  const lines = (type: 'income' | 'expense'): StatementLine[] =>
    accountBalances(
      accounts.filter((a) => a.type === type),
      inPeriod,
    )
      .filter((b) => b.brl !== 0 || inPeriod.some((p) => p.accountId === b.accountId))
      .map((b) => ({ accountId: b.accountId, name: nameOf.get(b.accountId) ?? '', brl: b.brl }));

  const income = lines('income');
  const expenses = lines('expense');
  const totalIncome = income.reduce((sum, l) => sum + l.brl, 0);
  const totalExpenses = expenses.reduce((sum, l) => sum + l.brl, 0);
  return { income, expenses, totalIncome, totalExpenses, result: totalIncome - totalExpenses };
}
