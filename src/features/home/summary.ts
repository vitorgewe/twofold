import type { AccountBalance } from '../ledger/reports';
import type { Account } from '../ledger/account-types';
import { BRL } from '../ledger/currency';

const DAY_MS = 24 * 60 * 60 * 1000;
export const BACKUP_STALE_DAYS = 30;

const pad = (n: number) => String(n).padStart(2, '0');

/** The calendar month of `now` in the device's date, as inclusive YYYY-MM-DD bounds. */
export function monthPeriod(now: Date): { from: string; to: string } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prefix = `${year}-${pad(month + 1)}`;
  return { from: `${prefix}-01`, to: `${prefix}-${pad(lastDay)}` };
}

export type BackupStatus = { kind: 'none' } | { kind: 'recent' | 'stale'; days: number };

/** `lastBackupAt` is the stored `last_backup_at` value (an ISO timestamp); anything unreadable counts as no backup. */
export function backupStatus(lastBackupAt: string | null, now: Date): BackupStatus {
  const at = lastBackupAt ? Date.parse(lastBackupAt) : NaN;
  if (Number.isNaN(at)) return { kind: 'none' };
  const days = Math.max(0, Math.floor((now.getTime() - at) / DAY_MS));
  return { kind: days > BACKUP_STALE_DAYS ? 'stale' : 'recent', days };
}

export type CurrencyBalance = { currency: string; native: number; brl: number };

/** One entry per non-BRL currency with a balance: assets minus liabilities, in the currency and in BRL. */
export function foreignBalances(
  accounts: readonly (Account & AccountBalance)[],
): CurrencyBalance[] {
  const totals = new Map<string, CurrencyBalance>();
  for (const account of accounts) {
    if (account.currency === BRL.code) continue;
    if (account.type !== 'asset' && account.type !== 'liability') continue;
    const sign = account.type === 'asset' ? 1 : -1;
    const entry = totals.get(account.currency) ?? { currency: account.currency, native: 0, brl: 0 };
    entry.native += sign * account.native;
    entry.brl += sign * account.brl;
    totals.set(account.currency, entry);
  }
  return [...totals.values()].filter((b) => b.native !== 0 || b.brl !== 0);
}
