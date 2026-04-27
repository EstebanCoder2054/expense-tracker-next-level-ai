import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { expenseRepository } from '@/features/expenses/expenseRepository';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { queryKeys } from '@/lib/query/queryClient';
import type { AppPreferences } from '@/types/domain';
import { rangeKeysForPeriod, type BalancePeriod } from '@/lib/utils/date';

function invalidateExpenseData(
  qc: ReturnType<typeof useQueryClient>,
  occurredOn?: string,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.expenses });
  void qc.invalidateQueries({ queryKey: queryKeys.categories });
  void qc.invalidateQueries({
    predicate: (q) =>
      q.queryKey[0] === 'expenses' &&
      (q.queryKey[1] === 'breakdown' ||
        q.queryKey[1] === 'activity' ||
        q.queryKey[1] === 'periodTotals'),
  });
  if (occurredOn) {
    void qc.invalidateQueries({ queryKey: queryKeys.expensesForDay(occurredOn) });
  } else {
    void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'expenses' && q.queryKey[1] === 'day' });
  }
}

export function useCategories() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => expenseRepository.listCategories(db),
  });
}

export function useAllExpenses() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => expenseRepository.listAll(db),
  });
}

export function useExpensesForDay(dateKey: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.expensesForDay(dateKey),
    queryFn: () => expenseRepository.listOnDate(db, dateKey),
  });
}

export function useDayBreakdown(dateKeys: string[]) {
  const db = useSQLiteContext();
  const key = dateKeys.slice().sort().join(',');
  return useQuery({
    queryKey: ['expenses', 'breakdown', key],
    queryFn: () => expenseRepository.breakdownByDateKeys(db, dateKeys),
    enabled: dateKeys.length > 0,
  });
}

export function useExpenseActivity(dateKeys: string[]) {
  const db = useSQLiteContext();
  const key = dateKeys.slice().sort().join(',');
  return useQuery({
    queryKey: ['expenses', 'activity', key],
    queryFn: () => expenseRepository.hasExpenseActivityByDateKeys(db, dateKeys),
    enabled: dateKeys.length > 0,
  });
}

export function usePeriodIncomeExpense(
  anchor: Date,
  period: BalancePeriod,
  weekStartsOn: 'monday' | 'sunday',
) {
  const db = useSQLiteContext();
  const { from, to } = rangeKeysForPeriod(anchor, period, weekStartsOn);
  const key = `${from}_${to}`;
  return useQuery({
    queryKey: ['expenses', 'periodTotals', key],
    queryFn: () => expenseRepository.sumIncomeExpenseBetween(db, from, to),
  });
}

export function useExpenseById(id: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['expenses', 'one', id],
    queryFn: () => (id ? expenseRepository.getById(db, id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function usePreferences() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.prefs,
    queryFn: (): Promise<AppPreferences> => settingsRepository.getPreferences(db),
  });
}

export function useCreateExpense() {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof expenseRepository.insert>[1]) =>
      expenseRepository.insert(db, input),
    onSuccess: (exp) => {
      invalidateExpenseData(qc, exp.occurredOn);
    },
  });
}

export function useUpdateExpense() {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof expenseRepository.updateExpense>[2]) =>
      expenseRepository.updateExpense(db, id, input),
    onSuccess: (exp) => {
      invalidateExpenseData(qc, exp.occurredOn);
      void qc.invalidateQueries({ queryKey: ['expenses', 'one', exp.id] });
    },
  });
}

export function useDeleteExpense() {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, occurredOn }: { id: string; occurredOn: string }) =>
      expenseRepository.deleteById(db, id).then(() => ({ id, occurredOn })),
    onSuccess: ({ occurredOn }) => {
      invalidateExpenseData(qc, occurredOn);
    },
  });
}

export function useSetExpensePinned() {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned, occurredOn }: { id: string; pinned: boolean; occurredOn: string }) =>
      expenseRepository.setPinned(db, id, pinned).then(() => ({ id, occurredOn })),
    onSuccess: ({ occurredOn }) => {
      invalidateExpenseData(qc, occurredOn);
    },
  });
}

export function useCreateCategory() {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof expenseRepository.insertCategory>[1]) =>
      expenseRepository.insertCategory(db, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
