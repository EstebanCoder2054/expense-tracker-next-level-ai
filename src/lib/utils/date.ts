/** Calendar day in local timezone, stable for SQLite. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Start of the calendar week containing `d` (local midnight). */
export function startOfWeekForDate(d: Date, weekStartsOn: 'monday' | 'sunday'): Date {
  const day = d.getDay();
  let offset: number;
  if (weekStartsOn === 'monday') {
    offset = day === 0 ? 6 : day - 1;
  } else {
    offset = day;
  }
  const start = new Date(d);
  start.setDate(d.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function getWeekDays(anchor: Date, weekStartsOn: 'monday' | 'sunday'): Date[] {
  const start = startOfWeekForDate(anchor, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatCurrencyDisplay(
  amountCents: number,
  currency: string,
  localeTag: string,
): string {
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

export function shortWeekdayLabel(d: Date, localeTag: string): string {
  try {
    return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(d);
  } catch {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] ?? '';
  }
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

/** Short range like "Mar 23 – 29" or cross-month "Mar 30 – Apr 5". */
export function formatWeekRangeLabel(
  weekStart: Date,
  weekEnd: Date,
  localeTag: string,
): string {
  try {
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const opt1: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const opt2: Intl.DateTimeFormatOptions = sameMonth
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' };
    const a = new Intl.DateTimeFormat(localeTag, opt1).format(weekStart);
    const b = new Intl.DateTimeFormat(localeTag, opt2).format(weekEnd);
    return `${a} – ${b}`;
  } catch {
    return `${toDateKey(weekStart)} – ${toDateKey(weekEnd)}`;
  }
}

export type BalancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function rangeKeysForPeriod(
  anchor: Date,
  period: BalancePeriod,
  weekStartsOn: 'monday' | 'sunday',
): { from: string; to: string } {
  if (period === 'daily') {
    const k = toDateKey(anchor);
    return { from: k, to: k };
  }
  if (period === 'weekly') {
    const s = startOfWeekForDate(anchor, weekStartsOn);
    const e = addDays(s, 6);
    return { from: toDateKey(s), to: toDateKey(e) };
  }
  if (period === 'monthly') {
    const s = startOfMonth(anchor);
    const e = endOfMonth(anchor);
    return { from: toDateKey(s), to: toDateKey(e) };
  }
  const s = startOfYear(anchor);
  const e = endOfYear(anchor);
  return { from: toDateKey(s), to: toDateKey(e) };
}
