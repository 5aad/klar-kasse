import "@/i18n";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { useThemeStore, type ThemePreference } from "@/stores/theme-store";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { initializeDatabase } from "@/db";
import { getUserPreferences } from "@/api/users";
import { queryClient } from "@/lib/query-client";

export default function RootLayout() {
  const { isScanScreen } = useReceiptScanStore();
  const systemScheme = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const resolvedTheme =
    themePreference === "system" ? (systemScheme ?? "light") : themePreference;

  useEffect(() => {
    initializeDatabase();
    getUserPreferences()
      .then((preferences) => {
        if (!preferences) return;

        setThemePreference(preferences.appTheme as ThemePreference);
      })
      .catch(() => undefined);
  }, [setThemePreference]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: `${isScanScreen ? "slide_from_left" : "default"}`,
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            animation: "simple_push",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    </QueryClientProvider>
  );
}
