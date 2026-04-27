import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useCreateCategory } from '@/hooks/useExpenseQueries';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

const ICON_CHOICES: (keyof typeof Ionicons.glyphMap)[] = [
  'pricetag-outline',
  'restaurant-outline',
  'car-outline',
  'home-outline',
  'bag-outline',
  'fitness-outline',
  'airplane-outline',
  'gift-outline',
  'cafe-outline',
  'bus-outline',
  'medical-outline',
  'school-outline',
];

const COLORS = ['#5D6BFF', '#8260FF', '#FF7B7B', '#34d399', '#f472b6', '#fbbf24', '#9ca3af'];

const schema = z.object({
  name: z.string().min(1, 'Name required').max(40),
  color: z.string(),
  icon: z.string(),
});

type Form = z.infer<typeof schema>;

export default function AddCategoryModal() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const create = useCreateCategory();

  const { control, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      color: COLORS[0],
      icon: ICON_CHOICES[0],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name,
      color: values.color,
      icon: values.icon,
    });
    router.back();
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.hero, { fontSize: 22 }]}>New category</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.lg }]}>
          Pick a color and icon. You can add more later.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField label="Name" value={value} onBlur={onBlur} onChangeText={onChange} />
          )}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          COLOR
        </Text>
        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, value } }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => onChange(c)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: c,
                    borderWidth: value === c ? 3 : 0,
                    borderColor: '#fff',
                  }}
                />
              ))}
            </View>
          )}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          ICON
        </Text>
        <Controller
          control={control}
          name="icon"
          render={({ field: { onChange, value } }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ICON_CHOICES.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => onChange(icon)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: value === icon ? colors.accentPrimary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.backgroundElevated,
                  }}>
                  <Ionicons name={icon} size={22} color={colors.textPrimary} />
                </Pressable>
              ))}
            </View>
          )}
        />

        <View style={{ marginTop: spacing.xxl }}>
          <Button title="Save category" onPress={() => void onSubmit()} loading={create.isPending} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
