/**
 * Design tokens — reference: deep navy base, blue→violet gradient accents.
 */
export const palette = {
  /** Deep navy, subtle blue (not flat black) */
  background: '#080c18',
  backgroundElevated: '#0f1424',
  surface: '#151b2e',
  surfaceHover: '#1a2238',
  border: '#2a3148',
  borderSubtle: '#1e2538',

  textPrimary: '#f4f6ff',
  textSecondary: '#9aa3bf',
  textMuted: '#6b7390',

  /** Primary CTA / income accent — electric blue (reference) */
  accentPrimary: '#5D6BFF',
  accentPrimaryEnd: '#8260FF',
  accentPrimaryMuted: '#4a54cc',

  /** Legacy aliases — prefer accentPrimary for new UI */
  accentOrange: '#5D6BFF',
  accentOrangeDim: '#4a54cc',
  accentPurple: '#8260FF',
  accentPurpleDim: '#6b4ddb',
  accentCyan: '#5D6BFF',

  /** Outflow / expense emphasis — coral-salmon */
  expense: '#FF7B7B',
  expenseMuted: '#cc6262',

  success: '#34d399',
  danger: '#FF7B7B',

  glass: 'rgba(15, 20, 36, 0.82)',
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowPrimary: {
    shadowColor: '#5D6BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

export type Theme = {
  colors: typeof palette;
  radii: typeof radii;
  spacing: typeof spacing;
  shadows: typeof shadows;
};

export const darkTheme: Theme = {
  colors: palette,
  radii,
  spacing,
  shadows,
};
