import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  expenses: ['expenses'] as const,
  expensesForDay: (dateKey: string) => ['expenses', 'day', dateKey] as const,
  categories: ['categories'] as const,
  prefs: ['preferences'] as const,
};
