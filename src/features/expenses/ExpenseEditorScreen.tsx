import { zodResolver } from '@hookform/resolvers/zod';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import {
  useCategories,
  useCreateExpense,
  useExpenseById,
  usePreferences,
  useUpdateExpense,
} from '@/hooks/useExpenseQueries';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import { expenseFormSchema, parseAmountToCents, type ExpenseFormValues } from '@/lib/validation/expense';
import { toDateKey } from '@/lib/utils/date';
import type { Category, ExpenseKind } from '@/types/domain';

type Props = {
  expenseId?: string;
};

export function ExpenseEditorScreen({ expenseId }: Props) {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const prefs = usePreferences();
  const cats = useCategories();
  const existing = useExpenseById(expenseId);
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const isEdit = !!expenseId;
  const currency = prefs.data?.currency ?? 'USD';

  const defaultDate = useMemo(() => {
    if (typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      return params.date;
    }
    return toDateKey(new Date());
  }, [params.date]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
      occurredOn: defaultDate,
      note: '',
      kind: 'expense',
    },
  });

  useEffect(() => {
    if (!existing.data || !isEdit) return;
    const e = existing.data;
    const amt = (e.amountCents / 100).toFixed(2);
    reset({
      amount: amt,
      categoryId: e.categoryId,
      occurredOn: e.occurredOn,
      note: e.note ?? '',
      kind: e.kind,
    });
  }, [existing.data, isEdit, reset]);

  useEffect(() => {
    const first = cats.data?.[0];
    if (first && !getValues('categoryId') && !isEdit) {
      setValue('categoryId', first.id);
    }
  }, [cats.data, getValues, setValue, isEdit]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      amountCents: parseAmountToCents(values.amount),
      currency,
      categoryId: values.categoryId,
      occurredOn: values.occurredOn,
      note: values.note?.trim() ? values.note.trim() : null,
      kind: values.kind as ExpenseKind,
    };
    if (isEdit && expenseId) {
      await update.mutateAsync({ id: expenseId, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    router.back();
  });

  const busy = create.isPending || update.isPending || existing.isLoading;

  if (isEdit && existing.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
          <Text style={[typography.hero, { fontSize: 24 }]}>
            {isEdit ? 'Edit transaction' : 'New transaction'}
          </Text>
          <Text style={[typography.bodyMuted, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
            Stored locally on this device.
          </Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            TYPE
          </Text>
          <Controller
            control={control}
            name="kind"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['expense', 'income'] as const).map((k) => {
                  const active = value === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => onChange(k)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: radii.md,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: active
                          ? k === 'income'
                            ? colors.accentPrimary
                            : colors.expense
                          : colors.border,
                        backgroundColor: active ? colors.surface : colors.backgroundElevated,
                        alignItems: 'center',
                      }}>
                      <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                        {k === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />

          <View style={{ height: spacing.lg }} />

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Amount"
                keyboardType="decimal-pad"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.amount?.message}
              />
            )}
          />

          <View style={{ height: spacing.lg }} />

          <View style={styles.catHead}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>CATEGORY</Text>
            <Pressable onPress={() => router.push('/modals/add-category' as Href)}>
              <Text style={[typography.caption, { color: colors.accentPrimary, fontWeight: '600' }]}>
                + New
              </Text>
            </Pressable>
          </View>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryChips
                categories={cats.data ?? []}
                selectedId={value}
                onSelect={onChange}
                error={errors.categoryId?.message}
              />
            )}
          />

          <View style={{ height: spacing.lg }} />

          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Note (optional)"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.note?.message}
              />
            )}
          />

          <View style={{ marginTop: spacing.xxl }}>
            <Button
              title={isEdit ? 'Save changes' : 'Save'}
              onPress={() => void onSubmit()}
              loading={busy}
              disabled={cats.isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CategoryChips({
  categories,
  selectedId,
  onSelect,
  error,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
}) {
  const { colors, radii } = useTheme();
  if (categories.length === 0) {
    return <ActivityIndicator color={colors.accentPrimary} />;
  }
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radii.full,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: active ? colors.accentPrimary : colors.border,
                backgroundColor: active ? colors.surfaceHover : colors.backgroundElevated,
              }}>
              <Text style={[typography.body, { fontSize: 14, color: active ? colors.textPrimary : colors.textSecondary }]}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: 6 }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  catHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
