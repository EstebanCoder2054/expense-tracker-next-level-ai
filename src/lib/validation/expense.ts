import { z } from 'zod';

export const expenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((s) => {
      const n = Number.parseFloat(s.replace(',', '.'));
      return !Number.isNaN(n) && n > 0;
    }, 'Invalid amount'),
  categoryId: z.string().uuid('Pick a category'),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  note: z.string().optional(),
  kind: z.enum(['expense', 'income']),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function parseAmountToCents(amount: string): number {
  const n = Number.parseFloat(amount.replace(',', '.'));
  return Math.round(n * 100);
}
