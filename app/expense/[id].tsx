import { useLocalSearchParams } from 'expo-router';

import { ExpenseEditorScreen } from '@/features/expenses/ExpenseEditorScreen';

export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExpenseEditorScreen expenseId={typeof id === 'string' ? id : undefined} />;
}
