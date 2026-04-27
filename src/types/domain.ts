/** Local expense row — mirrors future sync-friendly fields. */
export type ExpenseKind = 'expense' | 'income';

export type Expense = {
  id: string;
  amountCents: number;
  currency: string;
  categoryId: string;
  /** Local calendar day YYYY-MM-DD */
  occurredOn: string;
  note: string | null;
  spaceId: string | null;
  kind: ExpenseKind;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  /** Ionicons glyph name (stored as string) */
  icon: string;
};

export type WeekStart = 'monday' | 'sunday';

export type AppPreferences = {
  currency: string;
  localeTag: string;
  weekStartsOn: WeekStart;
};
