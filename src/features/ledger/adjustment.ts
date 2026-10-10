import type { Account, AccountType } from './account-types';
import { InvalidTransactionError, type PostingSide } from './balance';
import { BRL } from './currency';

export type AdjustmentPosting = {
  accountId: string;
  side: PostingSide;
  /** Always 0: a value adjustment changes the BRL value, not the native balance. */
  amount: number;
  amountBrl: number;
};

/** True when a value adjustment makes sense for the account: a foreign-currency asset or liability. */
export function canAdjustValue(account: Pick<Account, 'type' | 'currency'>): boolean {
  return account.currency !== BRL.code && (account.type === 'asset' || account.type === 'liability');
}

/** The account side that records a rise (changeBrl > 0) or fall (changeBrl < 0) in the account's value. */
function accountSide(type: AccountType, changeBrl: number): PostingSide {
  const rises = changeBrl > 0;
  if (type === 'asset') return rises ? 'debit' : 'credit';
  return rises ? 'credit' : 'debit';
}

/** Income for a gain (asset up, liability down), expense for a loss (asset down, liability up). */
export function counterAccountType(account: Pick<Account, 'type'>, changeBrl: number): 'income' | 'expense' {
  return accountSide(account.type, changeBrl) === 'debit' ? 'income' : 'expense';
}

/**
 * Builds the two postings of a value adjustment. changeBrl is the signed change, in centavos,
 * of the account's value in BRL.
 */
export function buildAdjustmentPostings(
  account: Pick<Account, 'id' | 'type' | 'currency'>,
  changeBrl: number,
  counterAccountId: string,
): AdjustmentPosting[] {
  if (!canAdjustValue(account)) throw new InvalidTransactionError('only foreign-currency assets and liabilities can be adjusted');
  if (!Number.isSafeInteger(changeBrl) || changeBrl === 0) throw new InvalidTransactionError('the change must be a non-zero whole number of centavos');

  const side = accountSide(account.type, changeBrl);
  const amountBrl = Math.abs(changeBrl);
  return [
    { accountId: account.id, side, amount: 0, amountBrl },
    { accountId: counterAccountId, side: side === 'debit' ? 'credit' : 'debit', amount: amountBrl, amountBrl },
  ];
}
