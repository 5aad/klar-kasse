import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { useThemeStore } from "@/stores/theme-store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const { isScanScreen } = useReceiptScanStore();
  const systemScheme = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const resolvedTheme =
    themePreference === "system" ? (systemScheme ?? "light") : themePreference;

  return (
    <>
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
          name="receipt-camera"
          options={{
            animation: "simple_push",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    </>
  );
}
