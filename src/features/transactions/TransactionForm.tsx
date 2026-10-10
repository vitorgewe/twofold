import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAccountsWithBalances, type Transaction, type TransactionInput } from '@/data/transactions';
import type { PostingDraft } from '@/features/ledger/balance';
import { BRL } from '@/features/ledger/currency';
import { isIsoDate } from '@/features/ledger/date';
import { formatAmount } from '@/features/ledger/money';
import { strings } from '@/ui/strings';

import {
  emptyRow,
  evaluateRow,
  formatBrlPlain,
  isBalanced,
  rowsFromPostings,
  summarize,
  type PostingRow,
} from './draft';

const t = strings.transactions;

const todayIso = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

type Props = {
  /** Resolves when the transaction is stored; a rejection is shown and the form keeps its values. */
  onSubmit: (draft: TransactionInput) => void | Promise<void>;
  /** A stored transaction to edit; the form starts filled with it. Mount it once the accounts have loaded. */
  initial?: Transaction;
  onCancel?: () => void;
};

export function TransactionForm({ onSubmit, initial, onCancel }: Props) {
  const { data } = useAccountsWithBalances({ includeArchived: initial !== undefined });
  const accounts = (data ?? []).filter((a) => !a.archived || initial?.postings.some((p) => p.accountId === a.id));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [rows, setRows] = useState<PostingRow[]>(() =>
    initial
      ? rowsFromPostings(initial.postings, (id) => (data ?? []).find((a) => a.id === id)?.currency ?? null)
      : [emptyRow(1), emptyRow(2)],
  );
  const [nextKey, setNextKey] = useState(initial ? initial.postings.length + 1 : 3);
  const [openKey, setOpenKey] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // A ref, not state: two taps in the same frame both see the stale `saving` value.
  const inFlight = useRef(false);

  const update = (key: number, patch: Partial<PostingRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const evaluated = rows.map((row) => {
    const account = accounts.find((a) => a.id === row.accountId) ?? null;
    return { row, account, result: evaluateRow(row, account?.currency ?? null) };
  });

  const postings: PostingDraft[] = [];
  for (const { row, account, result } of evaluated) {
    if (account && result.amountBrl !== null) {
      postings.push({ accountId: account.id, side: row.side, amountBrl: result.amountBrl });
    }
  }
  const summary = summarize(postings);
  const allComplete = evaluated.every((e) => e.account !== null && e.result.complete);
  const canSave =
    description.trim() !== '' && isIsoDate(date) && allComplete && isBalanced(postings) && summary.difference === 0;

  const submit = async () => {
    if (!canSave || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit({
        date,
        description: description.trim(),
        postings: evaluated.map(({ row, account, result }) => ({
          accountId: account!.id,
          side: row.side,
          amount: result.amount!,
          rate: result.currency!.code === BRL.code ? null : result.rate,
          amountBrl: result.amountBrl!,
        })),
      });
      // On success the screen navigates away; the guard stays on so a late tap cannot save twice.
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : t.saveFailed);
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>
        {initial ? t.editTitle : t.newTitle}
      </Text>

      <Text style={styles.label}>{t.description}</Text>
      <TextInput
        accessibilityLabel={t.description}
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>{t.date}</Text>
      <TextInput accessibilityLabel={t.date} style={styles.input} value={date} onChangeText={setDate} />
      {!isIsoDate(date) && <Text style={styles.error}>{t.dateInvalid}</Text>}

      {accounts.length === 0 && data !== undefined && <Text>{t.noAccounts}</Text>}

      {evaluated.map(({ row, account, result }, index) => {
        const foreign = result.currency !== null && result.currency.code !== BRL.code;
        return (
          <View key={row.key} testID={`posting-${index + 1}`} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.account}
              accessibilityState={{ expanded: openKey === row.key }}
              onPress={() => setOpenKey(openKey === row.key ? null : row.key)}
              style={styles.input}
            >
              <Text>{account ? `${account.name} (${account.currency})` : t.accountPlaceholder}</Text>
            </Pressable>
            {openKey === row.key && (
              <View accessibilityRole="list" style={styles.options}>
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    role="option"
                    aria-selected={a.id === row.accountId}
                    onPress={() => {
                      update(row.key, { accountId: a.id, amountText: '', rateText: '', brlText: null });
                      setOpenKey(null);
                    }}
                    style={styles.option}
                  >
                    <Text>{a.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View accessibilityRole="radiogroup" style={styles.sides}>
              {(['debit', 'credit'] as const).map((side) => (
                <Pressable
                  key={side}
                  accessibilityRole="radio"
                  accessibilityLabel={side === 'debit' ? t.debit : t.credit}
                  accessibilityState={{ checked: row.side === side }}
                  onPress={() => update(row.key, { side })}
                  style={[styles.side, row.side === side && styles.sideSelected]}
                >
                  <Text style={row.side === side ? styles.sideSelectedText : undefined}>
                    {side === 'debit' ? t.debit : t.credit}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.small}>{t.amount}</Text>
                <TextInput
                  accessibilityLabel={t.amount}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  value={row.amountText}
                  onChangeText={(text) => update(row.key, { amountText: text, brlText: null })}
                />
              </View>
              {foreign && (
                <View style={styles.field}>
                  <Text style={styles.small}>{t.rate}</Text>
                  <TextInput
                    accessibilityLabel={t.rate}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    value={row.rateText}
                    onChangeText={(text) => update(row.key, { rateText: text, brlText: null })}
                  />
                </View>
              )}
              {foreign && (
                <View style={styles.field}>
                  <Text style={styles.small}>{t.brlValue}</Text>
                  <TextInput
                    accessibilityLabel={t.brlValue}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    value={row.brlText ?? (result.amountBrl === null ? '' : formatBrlPlain(result.amountBrl))}
                    onChangeText={(text) => update(row.key, { brlText: text })}
                  />
                </View>
              )}
            </View>
            {result.amountError && result.currency && (
              <Text style={styles.error}>{t.amountInvalid(result.currency.code, result.currency.decimals)}</Text>
            )}
            {result.rateError && <Text style={styles.error}>{t.rateInvalid}</Text>}
            {result.brlError && <Text style={styles.error}>{t.brlInvalid}</Text>}

            {rows.length > 2 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t.removePosting} ${index + 1}`}
                onPress={() => setRows((current) => (current.length > 2 ? current.filter((r) => r.key !== row.key) : current))}
                style={styles.button}
              >
                <Text>{t.removePosting}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setRows((current) => [...current, emptyRow(nextKey)]);
          setNextKey(nextKey + 1);
        }}
        style={styles.button}
      >
        <Text>{t.addPosting}</Text>
      </Pressable>

      <View style={styles.summary}>
        <Text>
          {t.totalDebits}: <Text testID="total-debits">{formatAmount(summary.debits, BRL)}</Text>
        </Text>
        <Text>
          {t.totalCredits}: <Text testID="total-credits">{formatAmount(summary.credits, BRL)}</Text>
        </Text>
        <Text>
          {t.difference}: <Text testID="difference">{formatAmount(summary.difference, BRL)}</Text>
        </Text>
      </View>

      {saveError !== null && <Text style={styles.error}>{saveError}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave || saving }}
        disabled={!canSave || saving}
        onPress={submit}
        style={[styles.button, styles.primary, (!canSave || saving) && styles.disabled]}
      >
        <Text style={styles.primaryText}>{t.save}</Text>
      </Pressable>
      {onCancel && (
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}>
          <Text>{t.cancel}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontSize: 24, fontWeight: '600' },
  label: { fontWeight: '600' },
  small: { fontSize: 12, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  row: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  options: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6 },
  option: { padding: 10 },
  sides: { flexDirection: 'row', gap: 8 },
  side: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  sideSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  sideSelectedText: { color: '#fff' },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { flexGrow: 1, flexBasis: 100, minWidth: 0 },
  summary: { gap: 4, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  error: { color: '#b91c1c' },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, alignItems: 'center' },
  primary: { backgroundColor: '#111827', borderColor: '#111827' },
  primaryText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
