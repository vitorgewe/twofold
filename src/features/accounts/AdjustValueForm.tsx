import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getDatabase } from '@/data/database';
import { createTransaction, type AccountWithBalance } from '@/data/transactions';
import { buildAdjustmentPostings, counterAccountType } from '@/features/ledger/adjustment';
import { InvalidTransactionError } from '@/features/ledger/balance';
import { BRL } from '@/features/ledger/currency';
import { isIsoDate } from '@/features/ledger/date';
import { normalizeDecimalInput, parseAmount } from '@/features/ledger/money';
import { strings } from '@/ui/strings';

const todayIso = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Parses "200.00", "+200.00" or "-50.00" into signed centavos; null when empty, malformed or zero. */
function parseChange(text: string): number | null {
  const trimmed = text.trim();
  const negative = trimmed.startsWith('-');
  try {
    const centavos = parseAmount(normalizeDecimalInput(trimmed.replace(/^[+-]/, '')), BRL);
    return centavos === 0 ? null : negative ? -centavos : centavos;
  } catch {
    return null;
  }
}

type Props = {
  account: AccountWithBalance;
  /** Every active account, so the counter account list can be filtered. */
  accounts: AccountWithBalance[];
  onDone: () => void;
};

export function AdjustValueForm({ account, accounts, onDone }: Props) {
  const [changeText, setChangeText] = useState('');
  const [date, setDate] = useState(todayIso());
  const [counterId, setCounterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const change = parseChange(changeText);
  // Postings have no rate field for the counter side, so only BRL accounts qualify.
  const counterType = counterAccountType(account, change ?? 1);
  const counters = accounts.filter((a) => !a.archived && a.type === counterType && a.currency === BRL.code);
  const counterTypeLabel = counterType === 'income' ? strings.accounts.types.income : strings.accounts.types.expense;
  const selected = counters.some((c) => c.id === counterId) ? counterId : null;

  const save = async () => {
    if (change === null) return setError(strings.accounts.adjustChangeInvalid);
    if (!isIsoDate(date)) return setError(strings.accounts.adjustDateInvalid);
    if (!selected) return setError(strings.accounts.adjustCounterRequired);
    try {
      await createTransaction(await getDatabase(), {
        date,
        description: strings.accounts.adjustDescription(account.name),
        postings: buildAdjustmentPostings(account, change, selected),
      });
      onDone();
    } catch (e) {
      setError(e instanceof InvalidTransactionError ? e.message : 'Could not save the adjustment.');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>{strings.accounts.adjustChangeLabel}</Text>
      <TextInput
        accessibilityLabel={strings.accounts.adjustChangeLabel}
        keyboardType="numbers-and-punctuation"
        style={styles.input}
        value={changeText}
        onChangeText={(text) => {
          setChangeText(text);
          setError(null);
        }}
      />

      <Text style={styles.label}>{strings.accounts.adjustDateLabel}</Text>
      <TextInput
        accessibilityLabel={strings.accounts.adjustDateLabel}
        style={styles.input}
        value={date}
        onChangeText={(text) => {
          setDate(text);
          setError(null);
        }}
      />

      <Text style={styles.label}>{`${strings.accounts.adjustCounterLabel} (${counterTypeLabel})`}</Text>
      {counters.length === 0 ? (
        <Text>{counterType === 'income' ? strings.accounts.adjustNoCounterIncome : strings.accounts.adjustNoCounterExpense}</Text>
      ) : (
        <View accessibilityRole="radiogroup" accessibilityLabel={strings.accounts.adjustCounterLabel} style={styles.choices}>
          {counters.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === c.id }}
              onPress={() => {
                setCounterId(c.id);
                setError(null);
              }}
              style={[styles.choice, selected === c.id && styles.choiceSelected]}
            >
              <Text style={selected === c.id ? styles.choiceSelectedText : undefined}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={save} style={[styles.button, styles.primary]}>
          <Text style={styles.primaryText}>{strings.accounts.adjustSave}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.button}>
          <Text>{strings.accounts.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  choiceSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  choiceSelectedText: { color: '#fff' },
  error: { color: '#b91c1c' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6 },
  primary: { backgroundColor: '#111827', borderColor: '#111827' },
  primaryText: { color: '#fff', fontWeight: '600' },
});
