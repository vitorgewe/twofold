import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

import type { Database, SqlValue } from './database';

/** In-memory Database for tests: real SQL in Node, no native module. */
export async function createTestDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  const raw: SqlJsDatabase = new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  return {
    run: async (sql, params = []) => {
      raw.run(sql, params);
    },
    query: async <T,>(sql: string, params: SqlValue[] = []) => {
      const stmt = raw.prepare(sql);
      try {
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        return rows;
      } finally {
        stmt.free();
      }
    },
    transaction: async (callback) => {
      raw.run('BEGIN');
      try {
        const result = await callback();
        raw.run('COMMIT');
        return result;
      } catch (error) {
        raw.run('ROLLBACK');
        throw error;
      }
    },
  };
}
