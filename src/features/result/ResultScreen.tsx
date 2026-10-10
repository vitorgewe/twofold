import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useIncomeStatement } from '@/data/result';
import { isIsoDate } from '@/features/ledger/date';
import type { StatementLine } from '@/features/ledger/reports';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

import { resultPeriodFor, type ResultChoice } from './period';

const t = strings.result;
type Choice = ResultChoice | 'custom';
const CHOICES: { choice: Choice; label: string }[] = [
  { choice: 'month', label: t.periodThisMonth },
  { choice: 'lastMonth', label: t.periodLastMonth },
  { choice: 'year', label: t.periodThisYear },
  { choice: 'custom', label: t.periodCustom },
];

const largestFirst = (lines: readonly StatementLine[]) => [...lines].sort((a, b) => b.brl - a.brl);

function Section({ title, lines, totalLabel, total }: { title: string; lines: StatementLine[]; totalLabel: string; total: number }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {largestFirst(lines).map((line) => (
        <View key={line.accountId} style={styles.row}>
          <Text style={styles.name}>{line.name}</Text>
          <MoneyText brl={line.brl} />
        </View>
      ))}
      <View style={styles.row}>
        <Text style={styles.total}>{totalLabel}</Text>
        <MoneyText brl={total} />
      </View>
    </View>
  );
}

export function ResultScreen() {
  const [choice, setChoice] = useState<Choice>('month');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

  const period =
    choice === 'custom'
      ? isIsoDate(fromText) && isIsoDate(toText)
        ? { from: fromText, to: toText }
        : undefined
      : resultPeriodFor(choice, new Date());
  const { data: statement } = useIncomeStatement(period);

  const pick = (next: Choice) => {
    if (next === 'custom' && choice !== 'custom') {
      const current = resultPeriodFor(choice, new Date());
      setFromText(current.from);
      setToText(current.to);
    }
    setChoice(next);
  };

  const empty = statement && statement.income.length === 0 && statement.expenses.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/" accessibilityRole="link" style={styles.back}>
        {t.back}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {t.title}
      </Text>

      <View accessibilityRole="radiogroup" style={styles.chips}>
        {CHOICES.map((c) => (
          <Pressable
            key={c.choice}
            accessibilityRole="radio"
            accessibilityLabel={c.label}
            accessibilityState={{ checked: choice === c.choice }}
            onPress={() => pick(c.choice)}
            style={[styles.chip, choice === c.choice && styles.chipSelected]}
          >
            <Text style={choice === c.choice ? styles.chipSelectedText : undefined}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {choice === 'custom' && (
        <View style={styles.dates}>
          <View style={styles.dateField}>
            <Text style={styles.small}>{t.from}</Text>
            <TextInput
              accessibilityLabel={t.from}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              value={fromText}
              onChangeText={setFromText}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.small}>{t.to}</Text>
            <TextInput
              accessibilityLabel={t.to}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              value={toText}
              onChangeText={setToText}
            />
          </View>
        </View>
      )}
      {!period && <Text style={styles.small}>{t.dateInvalid}</Text>}

      {empty && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{t.emptyTitle}</Text>
          <Text>{t.emptyBody}</Text>
        </View>
      )}

      {statement && !empty && (
        <>
          <Section title={t.income} lines={statement.income} totalLabel={t.totalIncome} total={statement.totalIncome} />
          <Section title={t.expenses} lines={statement.expenses} totalLabel={t.totalExpenses} total={statement.totalExpenses} />
          <View style={[styles.row, styles.resultRow]}>
            <Text style={styles.sectionTitle}>{t.result}</Text>
            <MoneyText brl={statement.result} testID="period-result" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { fontSize: 14, color: '#1d4ed8' },
  title: { fontSize: 28, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  chipSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  chipSelectedText: { color: '#fff' },
  dates: { flexDirection: 'row', gap: 8 },
  dateField: { flex: 1, gap: 2 },
  small: { fontSize: 12, color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  notice: { gap: 4, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  noticeTitle: { fontWeight: '600' },
  section: { gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  name: { flexShrink: 1 },
  total: { fontWeight: '600' },
  resultRow: { borderTopWidth: 1, borderTopColor: '#111827' },
});
