import type { ViewToken } from "react-native";
import { colors } from "@repo/theme";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  onboardingPages,
  type OnboardingPage as OnboardingPageData,
} from "@/components/onboarding/onboarding-data";
import { OnboardingNextButton } from "@/components/onboarding/onboarding-next-button";
import OnboardingPage from "@/components/onboarding/onboarding-page";
import { OnboardingPagination } from "@/components/onboarding/onboarding-pagination";
import { setIsOnboardingDone } from "@/utils/onboarding-storage";

export default function OnboardingScreen() {
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<OnboardingPageData>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [pageIndex, setPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const finishOnboarding = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    await setIsOnboardingDone(true);
    router.replace("/dashboard");
  }, [isSaving]);

  const handleButtonPress = useCallback(() => {
    if (pageIndex === onboardingPages.length - 1) {
      finishOnboarding();
      return;
    }

    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: (pageIndex + 1) * width,
    });
  }, [finishOnboarding, pageIndex, width]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const nextIndex = viewableItems[0]?.index ?? 0;

      setPageIndex(nextIndex);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingPageData; index: number }) => (
      <OnboardingPage index={index} item={item} scrollX={scrollX} />
    ),
    [scrollX],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Animated.FlatList
        ref={flatListRef}
        bounces={false}
        data={onboardingPages}
        horizontal
        keyExtractor={(item) => item.key}
        pagingEnabled
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(bottom, 18) }]}>
        <OnboardingPagination
          length={onboardingPages.length}
          scrollX={scrollX}
        />
        <OnboardingNextButton
          disabled={isSaving}
          length={onboardingPages.length}
          pageIndex={pageIndex}
          progress={scrollX}
          width={width}
          onPress={handleButtonPress}
        />
      </View>
    </SafeAreaView>
  );
}

const viewabilityConfig = {
  itemVisiblePercentThreshold: 60,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  footer: {
    minHeight: 104,
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
