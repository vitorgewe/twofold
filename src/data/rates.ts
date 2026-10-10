import { notifyDataChanged } from './changes';
import { getDatabase, type Database } from './database';
import { useQuery, type QueryState } from './useQuery';

export type Rate = {
  currency: string;
  date: string;
  /** BRL price of one whole unit, scaled by RATE_SCALE. */
  rate: number;
};

export class RateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateError';
  }
}

type RateRow = { currency: string; date: string; rate_scaled: number };

const toRate = (row: RateRow): Rate => ({ currency: row.currency, date: row.date, rate: row.rate_scaled });

/** Stores a rate; a rate for the same currency and date replaces the old one. */
export async function addRate(db: Database, input: Rate): Promise<void> {
  if (input.currency === 'BRL') throw new RateError('BRL has no rate');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new RateError(`Date must be YYYY-MM-DD, got "${input.date}"`);
  if (!Number.isSafeInteger(input.rate) || input.rate <= 0) throw new RateError('Rate must be a positive integer');
  const currencies = await db.query('SELECT code FROM currency WHERE code = ?', [input.currency]);
  if (currencies.length === 0) throw new RateError(`Unknown currency: ${input.currency}`);
  await db.run('INSERT OR REPLACE INTO rate (currency, date, rate_scaled) VALUES (?, ?, ?)', [
    input.currency,
    input.date,
    input.rate,
  ]);
  notifyDataChanged();
}

export async function latestRate(db: Database, currency: string): Promise<Rate | null> {
  const rows = await db.query<RateRow>(
    'SELECT currency, date, rate_scaled FROM rate WHERE currency = ? ORDER BY date DESC LIMIT 1',
    [currency],
  );
  return rows[0] ? toRate(rows[0]) : null;
}

/** Newest first. */
export async function listRates(db: Database, currency: string): Promise<Rate[]> {
  const rows = await db.query<RateRow>(
    'SELECT currency, date, rate_scaled FROM rate WHERE currency = ? ORDER BY date DESC',
    [currency],
  );
  return rows.map(toRate);
}

export function useRates(currency: string): QueryState<Rate[]> {
  return useQuery(async () => listRates(await getDatabase(), currency), [currency]);
}
