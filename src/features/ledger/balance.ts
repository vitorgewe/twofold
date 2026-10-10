export type PostingSide = 'debit' | 'credit';

export type PostingDraft = {
  accountId: string;
  side: PostingSide;
  amountBrl: number;
};

export class UnbalancedTransactionError extends Error {
  readonly difference: number;

  constructor(difference: number) {
    super(`Transaction does not balance: debits minus credits is ${difference} centavos`);
    this.name = 'UnbalancedTransactionError';
    this.difference = difference;
  }
}

export class InvalidTransactionError extends Error {
  constructor(reason: string) {
    super(`Invalid transaction: ${reason}`);
    this.name = 'InvalidTransactionError';
  }
}

/** Sum of debit BRL amounts minus the sum of credit BRL amounts. */
export function balanceDifference(postings: readonly PostingDraft[]): number {
  let difference = 0;
  for (const posting of postings) {
    difference += posting.side === 'debit' ? posting.amountBrl : -posting.amountBrl;
  }
  return difference;
}

/** Returns why the postings cannot form a transaction, or null when their shape is acceptable. */
function structuralProblem(postings: readonly PostingDraft[]): string | null {
  if (postings.length < 2) return 'a transaction needs at least two postings';
  if (!postings.some((p) => p.side === 'debit')) return 'a transaction needs at least one debit';
  if (!postings.some((p) => p.side === 'credit')) return 'a transaction needs at least one credit';
  if (postings.some((p) => !Number.isSafeInteger(p.amountBrl) || p.amountBrl < 0)) {
    return 'amounts must be non-negative safe integers';
  }
  const total = postings.reduce((sum, p) => sum + p.amountBrl, 0);
  if (total === 0) return 'a transaction cannot be all zeros';
  return null;
}

export function isBalanced(postings: readonly PostingDraft[]): boolean {
  return structuralProblem(postings) === null && balanceDifference(postings) === 0;
}

/** Throws InvalidTransactionError for a malformed transaction, UnbalancedTransactionError when the sides differ. */
export function assertBalanced(postings: readonly PostingDraft[]): void {
  const problem = structuralProblem(postings);
  if (problem) throw new InvalidTransactionError(problem);
  const difference = balanceDifference(postings);
  if (difference !== 0) throw new UnbalancedTransactionError(difference);
}
