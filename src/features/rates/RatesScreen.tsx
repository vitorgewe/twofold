import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getDatabase } from '@/data/database';
import { addRate, useRates } from '@/data/rates';
import { isIsoDate } from '@/features/ledger/date';
import { normalizeDecimalInput, parseRate } from '@/features/ledger/money';
import { strings } from '@/ui/strings';

import { daysBetween, formatRate, todayIso } from './format';

const t = strings.rates;
const CURRENCIES = ['USD', 'BTC'] as const;

const ageLabel = (date: string): string => {
  const days = daysBetween(date, todayIso());
  if (days < 0) return t.inFuture;
  return days === 0 ? t.today : t.daysAgo(days);
};

export function RatesScreen() {
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [rateText, setRateText] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    let rate: number;
    try {
      rate = parseRate(normalizeDecimalInput(rateText));
    } catch {
      setError(t.rateInvalid);
      return;
    }
    if (rate <= 0) {
      setError(t.rateInvalid);
      return;
    }
    if (!isIsoDate(date)) {
      setError(t.dateInvalid);
      return;
    }
    try {
      await addRate(await getDatabase(), { currency, date, rate });
      setError(null);
      setRateText('');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t.saveFailed);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t.title}
      </Text>

      {CURRENCIES.map((code) => (
        <CurrencySection key={code} code={code} />
      ))}

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t.formTitle}
      </Text>
      <Text style={styles.label}>{t.currencyLabel}</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {CURRENCIES.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityLabel={code}
            accessibilityState={{ checked: currency === code }}
            onPress={() => setCurrency(code)}
            style={[styles.choice, currency === code && styles.choiceSelected]}
          >
            <Text style={currency === code ? styles.choiceSelectedText : undefined}>{code}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t.rateLabel}</Text>
      <TextInput
        accessibilityLabel={t.rateLabel}
        keyboardType="decimal-pad"
        style={styles.input}
        value={rateText}
        onChangeText={(text) => {
          setRateText(text);
          setError(null);
        }}
      />
      <Text style={styles.label}>{t.dateLabel}</Text>
      <TextInput
        accessibilityLabel={t.dateLabel}
        style={styles.input}
        value={date}
        onChangeText={(text) => {
          setDate(text);
          setError(null);
        }}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Pressable accessibilityRole="button" onPress={save} style={styles.primary}>
        <Text style={styles.primaryText}>{t.save}</Text>
      </Pressable>

      <Link href="/" style={styles.link}>
        {t.back}
      </Link>
    </ScrollView>
  );
}

function CurrencySection({ code }: { code: string }) {
  const { data: rates } = useRates(code);
  const latest = rates?.[0];
  return (
    <View style={styles.section} testID={`rates-${code}`}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {code}
      </Text>
      {rates && !latest && <Text style={styles.muted}>{t.none}</Text>}
      {latest && (
        <View>
          <Text style={styles.label}>{t.latest}</Text>
          <Text style={styles.latest}>
            {formatRate(latest.rate)} {t.perUnit(code)}
          </Text>
          <Text>
            {latest.date} ({ageLabel(latest.date)})
          </Text>
        </View>
      )}
      {rates && rates.length > 0 && (
        <View>
          <Text style={styles.label}>{t.history}</Text>
          {rates.map((rate) => (
            <View key={rate.date} style={styles.historyRow}>
              <Text>{rate.date}</Text>
              <Text>{formatRate(rate.rate)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontSize: 28, fontWeight: '600' },
  section: { gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  label: { fontWeight: '600' },
  latest: { fontSize: 20 },
  muted: { color: '#6b7280' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  choices: { flexDirection: 'row', gap: 8 },
  choice: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  choiceSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  choiceSelectedText: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  error: { color: '#b91c1c' },
  primary: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, backgroundColor: '#111827' },
  primaryText: { color: '#fff', fontWeight: '600' },
  link: { fontSize: 18, textDecorationLine: 'underline', marginTop: 8 },
});
