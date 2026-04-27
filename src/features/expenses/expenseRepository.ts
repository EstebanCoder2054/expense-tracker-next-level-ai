import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/utils/id';
import type { Category, Expense, ExpenseKind } from '@/types/domain';

function mapExpense(row: Record<string, unknown>): Expense {
  const k = row.kind == null ? 'expense' : String(row.kind);
  return {
    id: String(row.id),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    categoryId: String(row.category_id),
    occurredOn: String(row.occurred_on),
    note: row.note == null ? null : String(row.note),
    spaceId: row.space_id == null ? null : String(row.space_id),
    kind: k === 'income' ? 'income' : 'expense',
    pinned: Number(row.pinned) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
    sortOrder: Number(row.sort_order),
    isSystem: Number(row.is_system) === 1,
    icon: row.icon == null ? 'pricetag-outline' : String(row.icon),
  };
}

export type DayBreakdown = {
  incomeCents: number;
  expenseCents: number;
  /** incomeCents - expenseCents */
  netCents: number;
};

export const expenseRepository = {
  async listCategories(db: SQLiteDatabase): Promise<Category[]> {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM categories ORDER BY sort_order ASC, name ASC',
    );
    return rows.map(mapCategory);
  },

  async insertCategory(
    db: SQLiteDatabase,
    input: { name: string; color: string; icon: string },
  ): Promise<Category> {
    const id = createId();
    const maxRow = await db.getFirstAsync<{ m: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM categories',
    );
    const sortOrder = maxRow?.m ?? 0;
    await db.runAsync(
      `INSERT INTO categories (id, name, color, sort_order, is_system, icon) VALUES (?, ?, ?, ?, 0, ?)`,
      [id, input.name.trim(), input.color, sortOrder, input.icon],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM categories WHERE id = ?',
      [id],
    );
    if (!row) throw new Error('Category insert failed');
    return mapCategory(row);
  },

  async listAll(db: SQLiteDatabase): Promise<Expense[]> {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM expenses ORDER BY occurred_on DESC, pinned DESC, datetime(created_at) DESC`,
    );
    return rows.map(mapExpense);
  },

  async listOnDate(db: SQLiteDatabase, dateKey: string): Promise<Expense[]> {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM expenses WHERE occurred_on = ? ORDER BY pinned DESC, datetime(created_at) DESC`,
      [dateKey],
    );
    return rows.map(mapExpense);
  },

  async getById(db: SQLiteDatabase, id: string): Promise<Expense | null> {
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM expenses WHERE id = ?',
      [id],
    );
    return row ? mapExpense(row) : null;
  },

  async deleteById(db: SQLiteDatabase, id: string): Promise<void> {
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  },

  async setPinned(db: SQLiteDatabase, id: string, pinned: boolean): Promise<void> {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE expenses SET pinned = ?, updated_at = ? WHERE id = ?', [
      pinned ? 1 : 0,
      now,
      id,
    ]);
  },

  async updateExpense(
    db: SQLiteDatabase,
    id: string,
    input: {
      amountCents: number;
      currency: string;
      categoryId: string;
      occurredOn: string;
      note: string | null;
      kind: ExpenseKind;
    },
  ): Promise<Expense> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE expenses SET amount_cents = ?, currency = ?, category_id = ?, occurred_on = ?, note = ?, kind = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.amountCents,
        input.currency,
        input.categoryId,
        input.occurredOn,
        input.note,
        input.kind,
        now,
        id,
      ],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM expenses WHERE id = ?',
      [id],
    );
    if (!row) throw new Error('Update failed');
    return mapExpense(row);
  },

  /** Per-day income/expense totals for calendar cells. */
  async breakdownByDateKeys(
    db: SQLiteDatabase,
    keys: string[],
  ): Promise<Record<string, DayBreakdown>> {
    if (keys.length === 0) return {};
    const placeholders = keys.map(() => '?').join(',');
    const rows = await db.getAllAsync<{
      occurred_on: string;
      income_cents: number | null;
      expense_cents: number | null;
    }>(
      `SELECT occurred_on,
        SUM(CASE WHEN kind = 'income' THEN amount_cents ELSE 0 END) as income_cents,
        SUM(CASE WHEN kind = 'expense' THEN amount_cents ELSE 0 END) as expense_cents
       FROM expenses WHERE occurred_on IN (${placeholders}) GROUP BY occurred_on`,
      keys,
    );
    const out: Record<string, DayBreakdown> = {};
    for (const k of keys) {
      out[k] = { incomeCents: 0, expenseCents: 0, netCents: 0 };
    }
    for (const r of rows) {
      const inc = Number(r.income_cents ?? 0);
      const exp = Number(r.expense_cents ?? 0);
      const key = String(r.occurred_on);
      out[key] = {
        incomeCents: inc,
        expenseCents: exp,
        netCents: inc - exp,
      };
    }
    return out;
  },

  /** True if at least one expense (outflow) on that day — for calendar dot. */
  async hasExpenseActivityByDateKeys(
    db: SQLiteDatabase,
    keys: string[],
  ): Promise<Record<string, boolean>> {
    if (keys.length === 0) return {};
    const placeholders = keys.map(() => '?').join(',');
    const rows = await db.getAllAsync<{ occurred_on: string }>(
      `SELECT DISTINCT occurred_on FROM expenses
       WHERE occurred_on IN (${placeholders}) AND kind = 'expense'`,
      keys,
    );
    const out: Record<string, boolean> = {};
    for (const k of keys) out[k] = false;
    for (const r of rows) {
      out[String(r.occurred_on)] = true;
    }
    return out;
  },

  async sumIncomeExpenseBetween(
    db: SQLiteDatabase,
    fromKey: string,
    toKey: string,
  ): Promise<{ incomeCents: number; expenseCents: number }> {
    const row = await db.getFirstAsync<{
      income_cents: number | null;
      expense_cents: number | null;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_cents ELSE 0 END), 0) as income_cents,
        COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_cents ELSE 0 END), 0) as expense_cents
       FROM expenses WHERE occurred_on >= ? AND occurred_on <= ?`,
      [fromKey, toKey],
    );
    return {
      incomeCents: Number(row?.income_cents ?? 0),
      expenseCents: Number(row?.expense_cents ?? 0),
    };
  },

  async insert(
    db: SQLiteDatabase,
    input: {
      amountCents: number;
      currency: string;
      categoryId: string;
      occurredOn: string;
      note: string | null;
      kind: ExpenseKind;
    },
  ): Promise<Expense> {
    const id = createId();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO expenses (id, amount_cents, currency, category_id, occurred_on, note, space_id, kind, pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)`,
      [
        id,
        input.amountCents,
        input.currency,
        input.categoryId,
        input.occurredOn,
        input.note,
        input.kind,
        now,
        now,
      ],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM expenses WHERE id = ?',
      [id],
    );
    if (!row) throw new Error('Failed to read expense after insert');
    return mapExpense(row);
  },
};
