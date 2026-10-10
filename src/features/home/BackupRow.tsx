import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/ui/strings';

import type { BackupStatus } from './summary';

export function BackupRow({ status }: { status: BackupStatus }) {
  const warning = status.kind !== 'recent';
  const label = status.kind === 'none' ? strings.home.noBackup : strings.home.lastBackup(status.days);
  return (
    <View style={[styles.row, warning && styles.warningRow]}>
      <Text testID="backup-status" style={warning ? styles.warningText : styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  warningRow: { backgroundColor: '#fef3c7' },
  text: { color: '#374151' },
  warningText: { color: '#92400e', fontWeight: '600' },
});
