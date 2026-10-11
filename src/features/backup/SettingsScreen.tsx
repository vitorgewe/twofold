import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { exportBackup, importBackup, markBackupDone } from '@/data/backup';
import { applyCsvImport, previewCsvImport } from '@/data/csvImport';
import { getDatabase } from '@/data/database';
import { parseCsv } from '@/features/import/csv';
import type { ImportPlan } from '@/features/import/validate';
import { strings } from '@/ui/strings';

import { appVersion, pickBackupFile, pickCsvFile, saveBackupFile } from './files';
import { backupFileName, parseBackup, serializeBackup, type Backup, type BackupCounts } from './format';

const t = strings.settings;

type Preview = { backup: Backup; counts: BackupCounts };

export function SettingsScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ title: string; reasons: string[] } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [csvPlan, setCsvPlan] = useState<ImportPlan | null>(null);

  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const reset = () => {
    setMessage(null);
    setProblem(null);
    setPreview(null);
    setCsvPlan(null);
  };

  // A second press before the first finishes would run the same work twice; the ref
  // blocks it at once, the state disables the buttons.
  const once = (action: () => Promise<void>) => async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const onExport = once(async () => {
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
  });

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

  const onConfirm = once(async () => {
    if (!preview) return;
    try {
      await importBackup(await getDatabase(), preview.backup);
      reset();
      setMessage(t.imported);
    } catch (e) {
      setPreview(null);
      setProblem({ title: t.importFailed, reasons: e instanceof Error && e.message ? [e.message] : [] });
    }
  });

  const onPickCsv = async () => {
    reset();
    try {
      const text = await pickCsvFile();
      if (text === null) return;
      const parsed = parseCsv(text);
      if (!parsed.ok) return setProblem({ title: t.csvErrorsTitle, reasons: parsed.errors });
      setCsvPlan(await previewCsvImport(await getDatabase(), parsed.rows));
    } catch {
      setProblem({ title: t.importFailed, reasons: [] });
    }
  };

  const onConfirmCsv = once(async () => {
    if (!csvPlan || csvPlan.errors.length > 0) return;
    const count = csvPlan.newTransactions.length;
    try {
      await applyCsvImport(await getDatabase(), csvPlan);
      reset();
      setMessage(count === 0 ? t.csvNothingNew : t.csvImported(count));
    } catch (e) {
      reset();
      setProblem({ title: t.importFailed, reasons: e instanceof Error && e.message ? [e.message] : [] });
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t.title}
      </Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t.backup}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onExport}
          style={[styles.button, busy && styles.disabled]}
        >
          <Text style={styles.buttonText}>{t.export}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onPick} style={styles.button}>
          <Text style={styles.buttonText}>{t.import}</Text>
        </Pressable>
      </View>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t.csv}
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onPickCsv} style={styles.button}>
          <Text style={styles.buttonText}>{t.importCsv}</Text>
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
          <Text>{t.count(t.accounts, preview.counts.accounts)}</Text>
          <Text>{t.count(t.transactions, preview.counts.transactions)}</Text>
          <Text>{t.count(t.postings, preview.counts.postings)}</Text>
          <Text>{t.count(t.rates, preview.counts.rates)}</Text>
          <Text style={styles.warning}>{t.replaceWarning}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onConfirm}
              style={[styles.button, styles.danger, busy && styles.disabled]}
            >
              <Text style={styles.buttonText}>{t.confirmImport}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={reset} style={styles.button}>
              <Text style={styles.buttonText}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {csvPlan && (
        <View testID="csv-preview" style={styles.preview}>
          <Text style={styles.sectionTitle}>{t.csvPreviewTitle}</Text>
          <Text>{t.count(t.csvAccountsToCreate, csvPlan.accountsToCreate.length)}</Text>
          <Text>{t.count(t.csvNewTransactions, csvPlan.newTransactions.length)}</Text>
          <Text>{t.count(t.csvExisting, csvPlan.existingCount)}</Text>
          <Text>{t.count(t.csvPostings, csvPlan.postingCount)}</Text>
          {csvPlan.errors.length > 0 && (
            <View testID="csv-errors" style={styles.errorBox}>
              <Text style={styles.errorTitle}>{t.csvErrorsTitle}</Text>
              {csvPlan.errors.map((error, i) => (
                <Text key={i} style={styles.errorText}>
                  {error}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: csvPlan.errors.length > 0 || busy }}
              disabled={csvPlan.errors.length > 0 || busy}
              onPress={onConfirmCsv}
              style={[styles.button, (csvPlan.errors.length > 0 || busy) && styles.disabled]}
            >
              <Text style={styles.buttonText}>{t.csvImport}</Text>
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
  disabled: { opacity: 0.4 },
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
