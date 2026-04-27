import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const { isScanScreen } = useReceiptScanStore();
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
      <StatusBar style="auto" />
    </>
  );
}
