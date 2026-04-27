import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/utils/id';

const DEFAULT_CATEGORIES: { name: string; color: string; sortOrder: number; icon: string }[] = [
  { name: 'Food & dining', color: '#FF7B7B', sortOrder: 0, icon: 'restaurant-outline' },
  { name: 'Transport', color: '#5D6BFF', sortOrder: 1, icon: 'car-outline' },
  { name: 'Home', color: '#8260FF', sortOrder: 2, icon: 'home-outline' },
  { name: 'Shopping', color: '#f472b6', sortOrder: 3, icon: 'bag-outline' },
  { name: 'Health', color: '#34d399', sortOrder: 4, icon: 'fitness-outline' },
  { name: 'Other', color: '#9ca3af', sortOrder: 5, icon: 'ellipse-outline' },
];

/** Idempotent seed — safe to run on every launch. */
export async function seedCategoriesIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM categories',
  );
  if ((row?.c ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    for (const c of DEFAULT_CATEGORIES) {
      const id = createId();
      await db.runAsync(
        `INSERT INTO categories (id, name, color, sort_order, is_system, icon) VALUES (?, ?, ?, ?, 1, ?)`,
        [id, c.name, c.color, c.sortOrder, c.icon],
      );
    }
  });
}
