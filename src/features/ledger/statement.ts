import type { AccountType } from './account-types';
import type { PostingSide } from './balance';

/** A posting of one account, in the order it was stored (date, then insertion). */
export type StatementPosting = {
  id: string;
  date: string;
  description: string;
  side: PostingSide;
  amount: number;
  amountBrl: number;
};

export type StatementRow = {
  id: string;
  date: string;
  description: string;
  /** Signed change in the account's currency: positive increases the balance. */
  native: number;
  /** Signed change in BRL centavos. */
  brl: number;
  /** Account balance in BRL centavos after this posting. */
  balanceBrl: number;
};

const DEBIT_NORMAL: ReadonlySet<AccountType> = new Set<AccountType>(['asset', 'expense']);

/**
 * Signed rows with a running BRL balance. Postings must come oldest first; postings on the same date
 * keep the order given, so the running balance is stable. The result is newest first.
 */
export function buildStatement(type: AccountType, postings: readonly StatementPosting[]): StatementRow[] {
  let balanceBrl = 0;
  const rows = postings.map((p) => {
    const sign = (p.side === 'debit') === DEBIT_NORMAL.has(type) ? 1 : -1;
    balanceBrl += sign * p.amountBrl;
    return {
      id: p.id,
      date: p.date,
      description: p.description,
      native: p.amount === 0 ? 0 : sign * p.amount, // avoids -0, which would print as "-USD 0.00"
      brl: sign * p.amountBrl,
      balanceBrl,
    };
  });
  return rows.reverse();
}
