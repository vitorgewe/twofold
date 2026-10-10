import { subscribeToDataChanges } from './changes';
import { createDatabase, type Driver } from './connection';

/** A driver that logs each engine call and takes a tick to answer, like a native bridge. */
function fakeDriver(log: string[]): Driver {
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));
  return {
    run: async (sql) => {
      log.push(`run ${sql}`);
      await tick();
    },
    query: async <T,>(sql: string) => {
      log.push(`query ${sql}`);
      await tick();
      return [] as T[];
    },
    transaction: async (callback) => {
      log.push('begin');
      try {
        const result = await callback();
        log.push('commit');
        return result;
      } catch (error) {
        log.push('rollback');
        throw error;
      }
    },
  };
}

describe('createDatabase', () => {
  it('holds a read from another caller until the open transaction commits', async () => {
    const log: string[] = [];
    const db = createDatabase(fakeDriver(log));
    const inTransaction = db.transaction(async (tx) => {
      await tx.run('insert');
      await tx.query('inside');
      await tx.run('insert 2');
    });
    const outside = db.query('outside');
    await Promise.all([inTransaction, outside]);
    expect(log).toEqual(['begin', 'run insert', 'query inside', 'run insert 2', 'commit', 'query outside']);
  });

  it('notifies once per committed write transaction and never for reads', async () => {
    const db = createDatabase(fakeDriver([]));
    let notified = 0;
    const unsubscribe = subscribeToDataChanges(() => notified++);
    await db.query('select');
    await db.transaction(async (tx) => {
      await tx.query('select');
    });
    expect(notified).toBe(0);
    await db.transaction(async (tx) => {
      await tx.run('a');
      await tx.run('b');
    });
    expect(notified).toBe(1);
    await db.run('c');
    expect(notified).toBe(2);
    unsubscribe();
  });

  it('does not notify when the transaction rolls back, and keeps working afterwards', async () => {
    const log: string[] = [];
    const db = createDatabase(fakeDriver(log));
    let notified = 0;
    const unsubscribe = subscribeToDataChanges(() => notified++);
    await expect(
      db.transaction(async (tx) => {
        await tx.run('a');
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(notified).toBe(0);
    await db.query('after');
    expect(log).toContain('query after');
    unsubscribe();
  });
});
