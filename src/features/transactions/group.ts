import type { Posting } from '@/data/transactions';

/** The transaction's total in centavos: the sum of its debit postings, which equals the credits. */
export function totalBrl(postings: readonly Pick<Posting, 'side' | 'amountBrl'>[]): number {
  return postings.filter((p) => p.side === 'debit').reduce((sum, p) => sum + p.amountBrl, 0);
}

/** Splits a list that is already newest first into runs of the same date, keeping the order. */
export function groupByDate<T extends { date: string }>(items: readonly T[]): { date: string; items: T[] }[] {
  const groups: { date: string; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups;
}
