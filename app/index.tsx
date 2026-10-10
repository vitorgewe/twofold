import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/ui/strings';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.home.title}
      </Text>
      <Link href="/accounts" style={styles.link}>
        {strings.accounts.menu}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '600' },
  link: { fontSize: 18, textDecorationLine: 'underline' },
});
