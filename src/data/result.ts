import { incomeStatement, type IncomeStatement } from '../features/ledger/reports';
import { listAccounts } from './accounts';
import { getDatabase, type Database } from './database';
import { listReportPostings } from './transactions';
import { useQuery, type QueryState } from './useQuery';

export async function getIncomeStatement(
  db: Database,
  period: { from: string; to: string },
): Promise<IncomeStatement> {
  const accounts = await listAccounts(db, { includeArchived: true });
  return incomeStatement(await listReportPostings(db, period), accounts, period);
}

export function useIncomeStatement(period: { from: string; to: string } | undefined): QueryState<IncomeStatement | undefined> {
  return useQuery(async () => (period ? getIncomeStatement(await getDatabase(), period) : undefined), [
    period?.from,
    period?.to,
  ]);
}
