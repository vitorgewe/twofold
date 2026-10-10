import { TransactionForm } from '@/features/transactions/TransactionForm';

export default function NewTransaction() {
  // T042 wires onSubmit to the database.
  return <TransactionForm onSubmit={() => {}} />;
}
