import { backupStatus, foreignBalances, monthPeriod, type BackupStatus, type CurrencyBalance } from '../features/home/summary';
import { incomeStatement, netWorth } from '../features/ledger/reports';
import { listAccounts } from './accounts';
import { getDatabase, type Database } from './database';
import { getMeta } from './meta';
import { listAccountsWithBalances, listReportPostings } from './transactions';
import { useQuery, type QueryState } from './useQuery';

export const LAST_BACKUP_KEY = 'last_backup_at';

export type HomeSummary = {
  netWorth: number;
  monthResult: number;
  balances: CurrencyBalance[];
  backup: BackupStatus;
};

export async function getHomeSummary(db: Database, now: Date = new Date()): Promise<HomeSummary> {
  const accounts = await listAccounts(db, { includeArchived: true });
  const postings = await listReportPostings(db);
  const withBalances = await listAccountsWithBalances(db, { includeArchived: true });
  return {
    netWorth: netWorth(accounts, postings),
    monthResult: incomeStatement(postings, accounts, monthPeriod(now)).result,
    balances: foreignBalances(withBalances),
    backup: backupStatus(await getMeta(db, LAST_BACKUP_KEY), now),
  };
}

export function useHomeSummary(): QueryState<HomeSummary> {
  return useQuery(async () => getHomeSummary(await getDatabase()));
}
