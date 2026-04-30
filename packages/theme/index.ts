export const colors = {
  background: "#D6D4CE",
  surface: "#F2F0EA",
  text: "#101010",
  mutedText: "#91908D",
  border: "#91908D",
  primary: "#E63C3A",
  primaryText: "#FFFFFF",
} as const;

export const darkColors = {
  background: "#101010",
  surface: "#2B2B2A",
  text: "#F2F0EA",
  mutedText: "#D6D4CE",
  border: "#91908D",
  primary: "#E63C3A",
  primaryText: "#FFFFFF",
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

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const theme = {
  colors,
  darkColors,
  spacing,
  radius,
  fontSize,
} as const;

export type Theme = typeof theme;
