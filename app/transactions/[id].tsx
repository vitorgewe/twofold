import { useLocalSearchParams } from 'expo-router';

import { TransactionDetailScreen } from '@/features/transactions/TransactionDetailScreen';

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionDetailScreen transactionId={id} />;
}
