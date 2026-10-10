import { notifyDataChanged } from './changes';
import type { Database, SqlValue } from './database';

/** What a SQLite engine provides; createDatabase adds ordering and change notification on top. */
export type Driver = {
  run(sql: string, params: SqlValue[]): Promise<void>;
  query<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
};

/**
 * Wraps a driver so that
 * - calls run one at a time: a read from another caller never lands inside an open transaction;
 * - every committed write notifies subscribed queries, once per transaction, and reads never do.
 * Inside `transaction` the callback must use the `tx` it receives, not the outer database.
 */
export function createDatabase(driver: Driver): Database {
  let tail: Promise<unknown> = Promise.resolve();
  const exclusive = <T>(job: () => Promise<T>): Promise<T> => {
    const result = tail.then(job);
    tail = result.catch(() => undefined);
    return result;
  };

  return {
    run: (sql, params = []) =>
      exclusive(async () => {
        await driver.run(sql, params);
        notifyDataChanged();
      }),
    query: (sql, params = []) => exclusive(() => driver.query(sql, params)),
    transaction: (callback) =>
      exclusive(async () => {
        let wrote = false;
        const tx: Database = {
          run: (sql, params = []) => {
            wrote = true;
            return driver.run(sql, params);
          },
          query: (sql, params = []) => driver.query(sql, params),
          transaction: (inner) => inner(tx),
        };
        const result = await driver.transaction(() => callback(tx));
        if (wrote) notifyDataChanged();
        return result;
      }),
  };
}
