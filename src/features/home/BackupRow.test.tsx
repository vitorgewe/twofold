import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BackupRow } from './BackupRow';
import { backupStatus, monthPeriod } from './summary';

const NOW = new Date('2026-10-10T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const color = () => StyleSheet.flatten(screen.getByTestId('backup-status').props.style).color;

describe('BackupRow', () => {
  it('is plain 29 days after the last backup', async () => {
    await render(<BackupRow status={backupStatus(daysAgo(29), NOW)} />);
    expect(screen.getByText('Last backup 29 days ago')).toBeTruthy();
    expect(color()).toBe('#374151');
  });

  it('is in warning style 31 days after the last backup', async () => {
    await render(<BackupRow status={backupStatus(daysAgo(31), NOW)} />);
    expect(screen.getByText('Last backup 31 days ago')).toBeTruthy();
    expect(color()).toBe('#92400e');
  });

  it('warns when there is no backup', async () => {
    await render(<BackupRow status={backupStatus(null, NOW)} />);
    expect(screen.getByText('No backup yet')).toBeTruthy();
    expect(color()).toBe('#92400e');
  });
});

describe('monthPeriod', () => {
  it('spans the calendar month of the given date', () => {
    expect(monthPeriod(new Date(2026, 1, 15))).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthPeriod(new Date(2026, 9, 10))).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
});
