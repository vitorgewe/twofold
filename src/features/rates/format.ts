import { RATE_SCALE } from '../ledger/money';

/** Plain decimal text for a scaled rate, such as "5.1234"; trailing zeros are dropped but two decimals stay. */
export function formatRate(scaled: number): string {
  const whole = Math.floor(scaled / RATE_SCALE);
  const fraction = String(scaled % RATE_SCALE)
    .padStart(8, '0')
    .replace(/0+$/, '')
    .padEnd(2, '0');
  return `${whole}.${fraction}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const utcDay = (iso: string): number => {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

/** Whole days from `date` to `today` (both YYYY-MM-DD); negative for a future date. */
export function daysBetween(date: string, today: string): number {
  return Math.round((utcDay(today) - utcDay(date)) / DAY_MS);
}
