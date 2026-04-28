import { useFocusEffect, useRouter } from "expo-router";
import { BackHandler } from "react-native";
import { useCallback } from "react";

export function useAndroidBackToHome(homePath = "/home") {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(homePath);
          }

          return true; // stop app from closing
        }
      );

      return () => subscription.remove();
    }, [router, homePath])
  );
}