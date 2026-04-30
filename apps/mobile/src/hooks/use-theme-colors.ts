import { colors, darkColors } from "@repo/theme";
import { useColorScheme } from "react-native";

import { useThemeStore } from "@/stores/theme-store";

export function useResolvedTheme() {
  const systemScheme = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);

  return themePreference === "system"
    ? (systemScheme ?? "light")
    : themePreference;
}

export function useThemeColors() {
  const resolvedTheme = useResolvedTheme();

  return resolvedTheme === "dark" ? darkColors : colors;
}
