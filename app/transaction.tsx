import { useLocalSearchParams } from 'expo-router';

import { TransactionDetailScreen } from '@/features/transactions/TransactionDetailScreen';

// Not `transactions/[id]`: see app/account.tsx and ADR-0018. The id travels in the query:
// /transaction?id=...
export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <TransactionDetailScreen transactionId={id ?? ''} />;
}
