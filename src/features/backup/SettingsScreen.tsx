import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { exportBackup, importBackup, markBackupDone } from '@/data/backup';
import { getDatabase } from '@/data/database';
import { strings } from '@/ui/strings';

import { appVersion, pickBackupFile, saveBackupFile } from './files';
import { backupFileName, parseBackup, serializeBackup, type Backup, type BackupCounts } from './format';

const t = strings.settings;

type Preview = { backup: Backup; counts: BackupCounts };

export function SettingsScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ title: string; reasons: string[] } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const reset = () => {
    setMessage(null);
    setProblem(null);
    setPreview(null);
  };

  const onExport = async () => {
    reset();
    try {
      const db = await getDatabase();
      const now = new Date();
      const name = backupFileName(now);
      await saveBackupFile(name, serializeBackup(await exportBackup(db, now)));
      await markBackupDone(db, now);
      setMessage(t.exported(name));
    } catch {
      setProblem({ title: t.exportFailed, reasons: [] });
    }
  };

  const onPick = async () => {
    reset();
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      const result = parseBackup(text);
      if (result.ok) setPreview({ backup: result.backup, counts: result.counts });
      else setProblem({ title: t.rejectedTitle, reasons: result.errors });
    } catch {
      setProblem({ title: t.importFailed, reasons: [] });
    }
  };

  const onConfirm = async () => {
    if (!preview) return;
    try {
      await importBackup(await getDatabase(), preview.backup);
      reset();
      setMessage(t.imported);
    } catch (e) {
      setPreview(null);
      setProblem({ title: t.importFailed, reasons: e instanceof Error && e.message ? [e.message] : [] });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t.title}
      </Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t.backup}
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onExport} style={styles.button}>
          <Text style={styles.buttonText}>{t.export}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onPick} style={styles.button}>
          <Text style={styles.buttonText}>{t.import}</Text>
        </Pressable>
      </View>

      {message && (
        <Text testID="backup-message" style={styles.success}>
          {message}
        </Text>
      )}

      {problem && (
        <View testID="backup-errors" style={styles.errorBox}>
          <Text style={styles.errorTitle}>{problem.title}</Text>
          {problem.reasons.map((reason, i) => (
            <Text key={i} style={styles.errorText}>
              {reason}
            </Text>
          ))}
        </View>
      )}

      {preview && (
        <View testID="import-preview" style={styles.preview}>
          <Text style={styles.sectionTitle}>{t.previewTitle}</Text>
          <Text>{t.exportedAt(preview.backup.exported_at)}</Text>
          <Text>{t.count('Accounts', preview.counts.accounts)}</Text>
          <Text>{t.count('Transactions', preview.counts.transactions)}</Text>
          <Text>{t.count('Postings', preview.counts.postings)}</Text>
          <Text>{t.count('Rates', preview.counts.rates)}</Text>
          <Text style={styles.warning}>{t.replaceWarning}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.button, styles.danger]}>
              <Text style={styles.buttonText}>{t.confirmImport}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={reset} style={styles.button}>
              <Text style={styles.buttonText}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text testID="app-version">{t.version(appVersion())}</Text>
      <Link href="/" style={styles.link}>
        {t.back}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#111827' },
  danger: { backgroundColor: '#b91c1c' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  success: { color: '#166534' },
  errorBox: { padding: 12, borderRadius: 8, backgroundColor: '#fee2e2', gap: 4 },
  errorTitle: { color: '#991b1b', fontWeight: '600' },
  errorText: { color: '#991b1b' },
  preview: { padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', gap: 6 },
  warning: { color: '#92400e', fontWeight: '600' },
  link: { fontSize: 18, textDecorationLine: 'underline' },
});
