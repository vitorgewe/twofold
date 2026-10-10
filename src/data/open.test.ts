import * as SQLite from 'expo-sqlite';

import { getDatabase } from './database';

jest.mock('expo-sqlite');

describe('getDatabase', () => {
  it('closes the native handle when migrations fail, and opens a fresh one on retry', async () => {
    const closeAsync = jest.fn().mockResolvedValue(undefined);
    const native = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockRejectedValue(new Error('disk full')),
      getAllAsync: jest.fn().mockResolvedValue([]),
      withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => callback()),
      closeAsync,
    };
    jest.mocked(SQLite.openDatabaseAsync).mockResolvedValue(native as never);

    await expect(getDatabase()).rejects.toThrow('disk full');
    expect(closeAsync).toHaveBeenCalledTimes(1);
    await expect(getDatabase()).rejects.toThrow('disk full');
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(2);
    expect(closeAsync).toHaveBeenCalledTimes(2);
  });
});
