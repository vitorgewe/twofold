import { monthPeriod } from '../home/summary';

export type Period = { from?: string; to?: string };
export type PeriodChoice = 'month' | 'year' | 'all';

/** The calendar year of `now` in the device's date, as inclusive YYYY-MM-DD bounds. */
export function yearPeriod(now: Date): { from: string; to: string } {
  const year = String(now.getFullYear()).padStart(4, '0');
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** The filter bounds of a quick choice; "all" has none. */
export function periodFor(choice: PeriodChoice, now: Date): Period {
  if (choice === 'month') return monthPeriod(now);
  if (choice === 'year') return yearPeriod(now);
  return {};
}
