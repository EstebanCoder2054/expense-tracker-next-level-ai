import { type TextStyle } from 'react-native';

import { palette } from '@/lib/theme/tokens';

/** Shared text styles for consistent hierarchy (system font, premium weights). */
export const typography = {
  hero: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: palette.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: palette.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: palette.textPrimary,
  },
  bodyMuted: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: palette.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: palette.textMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} satisfies Record<string, TextStyle>;
