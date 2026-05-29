import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { getIsOnboardingDone } from "@/utils/onboarding-storage";
export default function Index() {
  const themeColors = useThemeColors();

  useEffect(() => {
    let isMounted = true;

    async function routeFromOnboardingStatus() {
      const isOnboardingDone = await getIsOnboardingDone();

      if (isMounted) {
        router.replace(isOnboardingDone ? "/(dashboard)" : "/onboarding");
      }
    }

    routeFromOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View
      style={[styles.screen, { backgroundColor: themeColors.background }]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
