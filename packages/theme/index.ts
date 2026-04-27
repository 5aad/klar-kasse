export const colors = {
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#111827',
  mutedText: '#4b5563',
  border: '#e5e7eb',
  primary: '#2563eb',
  primaryText: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
} as const;

export type Theme = typeof theme;
