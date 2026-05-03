import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
// import { initExecutorch } from "react-native-executorch";
// import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";
export default function Index() {
  // initExecutorch({ resourceFetcher: ExpoResourceFetcher });
  useEffect(() => {
    let isMounted = true;

    async function routeFromOnboardingStatus() {
      const { getIsOnboardingDone } = await import(
        "@/utils/onboarding-storage"
      );
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
    <View style={styles.screen}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
});
