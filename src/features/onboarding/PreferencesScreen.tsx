import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { COMMON_CURRENCIES, COMMON_LOCALE_TAGS } from '@/lib/constants/localeCurrency';
import { queryKeys } from '@/lib/query/queryClient';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import type { AppPreferences, WeekStart } from '@/types/domain';
import { z } from 'zod';

const prefSchema = z.object({
  currency: z
    .string()
    .length(3, 'Use 3-letter code')
    .transform((s) => s.toUpperCase()),
  localeTag: z.string().min(2, 'e.g. en-US'),
  weekStartsOn: z.enum(['monday', 'sunday']),
});

type PrefForm = z.infer<typeof prefSchema>;

export function PreferencesScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const qc = useQueryClient();
  const { colors, radii, spacing } = useTheme();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrefForm>({
    resolver: zodResolver(prefSchema),
    defaultValues: {
      currency: 'USD',
      localeTag: 'en-US',
      weekStartsOn: 'monday',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const prefs: AppPreferences = {
      currency: values.currency,
      localeTag: values.localeTag,
      weekStartsOn: values.weekStartsOn as WeekStart,
    };
    await settingsRepository.savePreferences(db, prefs);
    await settingsRepository.setOnboardingComplete(db, true);
    void qc.invalidateQueries({ queryKey: queryKeys.prefs });
    router.replace('/(tabs)/home');
  });

  return (
    <Screen scroll contentStyle={{ paddingBottom: 40 }}>
      <Text style={[typography.hero, { fontSize: 26 }]}>A few defaults</Text>
      <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
        You can change these anytime in settings later.
      </Text>

      <Controller
        control={control}
        name="currency"
        render={({ field: { onChange, value } }) => (
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
              Currency
            </Text>
            <Pressable
              onPress={() => setCurrencyOpen(true)}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: radii.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: errors.currency ? colors.expense : colors.border,
                backgroundColor: colors.backgroundElevated,
              }}>
              <Text style={typography.body}>{value}</Text>
            </Pressable>
            {errors.currency ? (
              <Text style={[typography.caption, { color: colors.expense, marginTop: 4 }]}>
                {errors.currency.message}
              </Text>
            ) : null}

            <Modal visible={currencyOpen} transparent animationType="fade">
              <View style={styles.modalRoot}>
                <Pressable style={styles.modalBackdrop} onPress={() => setCurrencyOpen(false)} />
                <View
                  style={[
                    styles.sheet,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      maxHeight: '55%',
                    },
                  ]}>
                  <Text style={[typography.title, { marginBottom: spacing.md }]}>Currency</Text>
                  <FlatList
                    data={[...COMMON_CURRENCIES]}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          onChange(item);
                          setCurrencyOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.sheetRow,
                          {
                            backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
                            borderBottomColor: colors.borderSubtle,
                          },
                        ]}>
                        <Text style={[typography.body, item === value && { color: colors.accentPrimary }]}>
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
        )}
      />

      <View style={{ height: spacing.md }} />

      <Controller
        control={control}
        name="localeTag"
        render={({ field: { onChange, value } }) => (
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
              Locale
            </Text>
            <Pressable
              onPress={() => setLocaleOpen(true)}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: radii.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: errors.localeTag ? colors.expense : colors.border,
                backgroundColor: colors.backgroundElevated,
              }}>
              <Text style={typography.body}>{value}</Text>
            </Pressable>
            {errors.localeTag ? (
              <Text style={[typography.caption, { color: colors.expense, marginTop: 4 }]}>
                {errors.localeTag.message}
              </Text>
            ) : null}

            <Modal visible={localeOpen} transparent animationType="fade">
              <View style={styles.modalRoot}>
                <Pressable style={styles.modalBackdrop} onPress={() => setLocaleOpen(false)} />
                <View
                  style={[
                    styles.sheet,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      maxHeight: '55%',
                    },
                  ]}>
                  <Text style={[typography.title, { marginBottom: spacing.md }]}>Locale</Text>
                  <FlatList
                    data={[...COMMON_LOCALE_TAGS]}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          onChange(item);
                          setLocaleOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.sheetRow,
                          {
                            backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
                            borderBottomColor: colors.borderSubtle,
                          },
                        ]}>
                        <Text style={[typography.body, item === value && { color: colors.accentPrimary }]}>
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
        )}
      />

      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        FIRST DAY OF WEEK
      </Text>
      <Controller
        control={control}
        name="weekStartsOn"
        render={({ field: { onChange, value } }) => (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['monday', 'sunday'] as const).map((w) => {
              const active = value === w;
              return (
                <Pressable
                  key={w}
                  onPress={() => onChange(w)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: active ? colors.accentPrimary : colors.border,
                    backgroundColor: active ? colors.surface : colors.backgroundElevated,
                    alignItems: 'center',
                  }}>
                  <Text style={[typography.body, { fontSize: 14 }]}>
                    {w === 'monday' ? 'Monday' : 'Sunday'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />

      <View style={{ marginTop: spacing.xxl }}>
        <Button title="Enter app" onPress={() => void onSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  sheetRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
