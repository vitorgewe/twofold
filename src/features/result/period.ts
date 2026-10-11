import { monthPeriod } from '../home/summary';
import { yearPeriod } from '../transactions/period';

export type ResultPeriod = { from: string; to: string };
export type ResultChoice = 'month' | 'lastMonth' | 'year';

/** The calendar month before the one of `now`, as inclusive YYYY-MM-DD bounds (January looks back to December). */
export function lastMonthPeriod(now: Date): ResultPeriod {
  return monthPeriod(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

/** The bounds of a quick choice, in the device's date. */
export function resultPeriodFor(choice: ResultChoice, now: Date): ResultPeriod {
  if (choice === 'month') return monthPeriod(now);
  if (choice === 'lastMonth') return lastMonthPeriod(now);
  return yearPeriod(now);
}
