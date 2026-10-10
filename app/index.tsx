import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/ui/strings';

export default function Home() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.home.title}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={styles.button}>
        <Text style={styles.buttonText}>{strings.home.newTransaction}</Text>
      </Pressable>
      <Link href="/accounts" style={styles.link}>
        {strings.accounts.menu}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '600' },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#111827' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { fontSize: 18, textDecorationLine: 'underline' },
});
