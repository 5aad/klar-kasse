import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";

import type { OnboardingPage as OnboardingPageData } from "./onboarding-data";

type Props = {
  item: OnboardingPageData;
  index: number;
  scrollX: Animated.Value;
};

function OnboardingPage({ item, index, scrollX }: Props) {
  const { width } = useWindowDimensions();
  const adaptive = useAdaptiveLayout();
  const themeColors = useThemeColors();
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageStyle = {
    opacity: scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateY: scrollX.interpolate({
          inputRange,
          outputRange: [72, 0, 72],
          extrapolate: "clamp",
        }),
      },
      {
        scale: scrollX.interpolate({
          inputRange,
          outputRange: [0.88, 1, 0.88],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const textStyle = {
    opacity: scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateY: scrollX.interpolate({
          inputRange,
          outputRange: [48, 0, 48],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <View
      style={[styles.page, adaptive.isMedium && styles.pageWide, { width }]}
    >
      <Animated.View style={[styles.visual, imageStyle]}>
        <View
          style={[styles.halo, { backgroundColor: `${themeColors.primary}24` }]}
        />
        <View
          style={[
            styles.phone,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.phoneHeader}>
            <View
              style={[
                styles.headerDot,
                { backgroundColor: themeColors.primary },
              ]}
            />
            <View
              style={[
                styles.headerLine,
                { backgroundColor: themeColors.background },
              ]}
            />
          </View>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: themeColors.background },
            ]}
          >
            <MaterialCommunityIcons
              color={themeColors.primary}
              name={item.icon}
              size={74}
            />
          </View>
          <View style={styles.receiptRows}>
            <View
              style={[
                styles.receiptLine,
                styles.receiptLineLarge,
                { backgroundColor: themeColors.mutedText },
              ]}
            />
            <View
              style={[
                styles.receiptLine,
                { backgroundColor: themeColors.mutedText },
              ]}
            />
            <View
              style={[
                styles.receiptLine,
                { backgroundColor: themeColors.mutedText },
              ]}
            />
            <View
              style={[
                styles.totalRow,
                { backgroundColor: themeColors.background },
              ]}
            >
              <View
                style={[
                  styles.totalLine,
                  { backgroundColor: themeColors.primary },
                ]}
              />
              <View
                style={[
                  styles.totalPill,
                  { backgroundColor: themeColors.primary },
                ]}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.copy, adaptive.isMedium && styles.copyWide, textStyle]}
      >
        <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
          {item.eyebrow}
        </Text>
        <Text
          style={[
            styles.title,
            adaptive.isMedium && styles.textWide,
            { color: themeColors.text },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.body,
            adaptive.isMedium && styles.textWide,
            { color: themeColors.mutedText },
          ]}
        >
          {item.body}
        </Text>
      </Animated.View>
    </View>
  );
}

export default memo(OnboardingPage);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 34,
  },
  pageWide: {
    flexDirection: "row",
    gap: 56,
    paddingHorizontal: 56,
  },
  visual: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: 999,
  },
  phone: {
    width: "64%",
    aspectRatio: 0.72,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    gap: 18,
  },
  phoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  headerLine: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
  iconWrap: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  receiptRows: {
    gap: 10,
  },
  receiptLine: {
    width: "72%",
    height: 9,
    borderRadius: 999,
  },
  receiptLineLarge: {
    width: "92%",
  },
  totalRow: {
    height: 38,
    marginTop: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLine: {
    width: "42%",
    height: 8,
    borderRadius: 999,
    opacity: 0.85,
  },
  totalPill: {
    width: 34,
    height: 14,
    borderRadius: 999,
  },
  copy: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    gap: 12,
  },
  copyWide: {
    alignItems: "flex-start",
    maxWidth: 430,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 33,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: 0,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  textWide: {
    textAlign: "left",
  },
});
