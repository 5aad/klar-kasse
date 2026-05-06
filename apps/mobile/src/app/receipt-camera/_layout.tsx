import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useReceiptScanStore } from "@/stores/receipt-scan-store";

export default function ReceiptCameraLayout() {
  const setIsScanScreen = useReceiptScanStore((state) => state.setIsScanScreen);
  const goToDashboard = () => {
    setIsScanScreen(true);
    router.replace("/(dashboard)");
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Scan Receipt",
          headerShown: false,
          headerTitleAlign: "center",
          headerBackButtonDisplayMode: "minimal",
          headerLeft: () => (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={styles.backButton}
              onPress={goToDashboard}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={32}
                color="black"
              />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="captured"
        options={{
          headerShown: false,
          title: "Receipt Preview",
          headerTitleAlign: "center",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
