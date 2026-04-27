import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppPreferences, WeekStart } from '@/types/domain';

const KEYS = {
  onboardingComplete: 'onboarding_complete',
  entryMode: 'entry_mode',
  currency: 'pref_currency',
  locale: 'pref_locale',
  weekStartsOn: 'pref_week_starts_on',
} as const;

export type EntryMode = 'local' | 'pending_cloud';

export const settingsRepository = {
  async get(db: SQLiteDatabase, key: string): Promise<string | null> {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  },

  async set(db: SQLiteDatabase, key: string, value: string): Promise<void> {
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  },

  async isOnboardingComplete(db: SQLiteDatabase): Promise<boolean> {
    const v = await settingsRepository.get(db, KEYS.onboardingComplete);
    return v === '1';
  },

  async setOnboardingComplete(db: SQLiteDatabase, done: boolean): Promise<void> {
    await settingsRepository.set(db, KEYS.onboardingComplete, done ? '1' : '0');
  },

  async getPreferences(db: SQLiteDatabase): Promise<AppPreferences> {
    const currency = (await settingsRepository.get(db, KEYS.currency)) ?? 'USD';
    const localeTag = (await settingsRepository.get(db, KEYS.locale)) ?? 'en-US';
    const w = (await settingsRepository.get(db, KEYS.weekStartsOn)) as WeekStart | null;
    const weekStartsOn: WeekStart = w === 'sunday' ? 'sunday' : 'monday';
    return { currency, localeTag, weekStartsOn };
  },

  async savePreferences(db: SQLiteDatabase, prefs: AppPreferences): Promise<void> {
    await db.withTransactionAsync(async () => {
      await settingsRepository.set(db, KEYS.currency, prefs.currency);
      await settingsRepository.set(db, KEYS.locale, prefs.localeTag);
      await settingsRepository.set(db, KEYS.weekStartsOn, prefs.weekStartsOn);
    });
  },

  /** Tracks how the user entered the app — used when Phase 2 migrates local → cloud. */
  async setEntryMode(db: SQLiteDatabase, mode: EntryMode): Promise<void> {
    await settingsRepository.set(db, KEYS.entryMode, mode);
  },
};
