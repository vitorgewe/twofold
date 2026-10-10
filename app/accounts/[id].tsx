import { useLocalSearchParams } from 'expo-router';

import { StatementScreen } from '@/features/accounts/StatementScreen';

export default function AccountStatement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StatementScreen accountId={id} />;
}
