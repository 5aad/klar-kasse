import type { ViewToken } from "react-native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Alert,
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
import OnboardingSetupPage from "@/components/onboarding/onboarding-setup-page";
import { saveMonthlyBudget } from "@/api/budgets";
import { saveUserPreferences } from "@/api/users";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { queryClient } from "@/lib/query-client";
import { downloadAvatarImage } from "@/utils/avatar-images";
import { setIsOnboardingDone } from "@/utils/onboarding-storage";
import { requestBudgetWidgetRefresh } from "@/widgets/budget-widget-refresh";

export default function OnboardingScreen() {
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const flatListRef = useRef<FlatList<OnboardingPageData>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [pageIndex, setPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [downloadedAvatarUrls, setDownloadedAvatarUrls] = useState<string[]>(
    [],
  );
  const [downloadingAvatarUrl, setDownloadingAvatarUrl] = useState<
    string | null
  >(null);
  const [avatarPreviewRefreshKey, setAvatarPreviewRefreshKey] = useState(0);

  const selectAvatar = useCallback(async (url: string) => {
    setDownloadingAvatarUrl(url);

    try {
      const localUri = await downloadAvatarImage(url);

      setProfileImageUri(localUri);
      setDownloadedAvatarUrls((currentUrls) =>
        currentUrls.includes(url) ? currentUrls : [...currentUrls, url],
      );
      setAvatarPreviewRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      console.warn("Onboarding avatar download failed:", error);
      Alert.alert(
        "Could not download avatar",
        "Check your internet connection and try again.",
      );
    } finally {
      setDownloadingAvatarUrl(null);
    }
  }, []);

  const updateBudget = useCallback((value: string) => {
    setBudget(value.replace(/[^\d.,]/g, ""));
  }, []);

  const finishOnboarding = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const trimmedName = name.trim();
      const budgetAmount = Number(budget.replace(",", "."));

      await saveUserPreferences({
        ...(trimmedName ? { name: trimmedName } : undefined),
        ...(profileImageUri ? { profileImageUri } : undefined),
      });

      if (Number.isFinite(budgetAmount) && budgetAmount > 0) {
        await saveMonthlyBudget({ limitAmount: budgetAmount });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["monthly-budget"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["user-preferences"] }),
      ]);
      await setIsOnboardingDone(true);
      void requestBudgetWidgetRefresh();
      router.replace("/(dashboard)");
    } catch (error) {
      console.warn("Onboarding setup failed:", error);
      Alert.alert(
        "Setup could not be saved",
        "Please try again before starting.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [budget, isSaving, name, profileImageUri]);

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
    ({ item, index }: { item: OnboardingPageData; index: number }) =>
      item.key === "setup" ? (
        <OnboardingSetupPage
          budget={budget}
          downloadedAvatarUrls={downloadedAvatarUrls}
          downloadingAvatarUrl={downloadingAvatarUrl}
          name={name}
          previewRefreshKey={avatarPreviewRefreshKey}
          profileImageUri={profileImageUri}
          onBudgetChange={updateBudget}
          onNameChange={setName}
          onSelectAvatar={selectAvatar}
        />
      ) : (
        <OnboardingPage index={index} item={item} scrollX={scrollX} />
      ),
    [
      avatarPreviewRefreshKey,
      budget,
      downloadedAvatarUrls,
      downloadingAvatarUrl,
      name,
      profileImageUri,
      scrollX,
      selectAvatar,
      updateBudget,
    ],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
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
          disabled={isSaving || Boolean(downloadingAvatarUrl)}
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
