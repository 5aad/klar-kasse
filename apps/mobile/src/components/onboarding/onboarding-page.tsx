import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import type { OnboardingPage as OnboardingPageData } from "./onboarding-data";

type Props = {
  item: OnboardingPageData;
  index: number;
  scrollX: Animated.Value;
};

function OnboardingPage({ item, index, scrollX }: Props) {
  const { width } = useWindowDimensions();
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
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.visual, imageStyle]}>
        <View style={[styles.halo, { backgroundColor: item.softAccent }]} />
        <View style={styles.phone}>
          <View style={styles.phoneHeader}>
            <View
              style={[styles.headerDot, { backgroundColor: item.accent }]}
            />
            <View style={styles.headerLine} />
          </View>
          <View style={[styles.iconWrap, { backgroundColor: item.softAccent }]}>
            <MaterialCommunityIcons
              color={item.accent}
              name={item.icon}
              size={74}
            />
          </View>
          <View style={styles.receiptRows}>
            <View style={[styles.receiptLine, styles.receiptLineLarge]} />
            <View style={styles.receiptLine} />
            <View style={styles.receiptLine} />
            <View
              style={[styles.totalRow, { backgroundColor: item.softAccent }]}
            >
              <View
                style={[styles.totalLine, { backgroundColor: item.accent }]}
              />
              <View
                style={[styles.totalPill, { backgroundColor: item.accent }]}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.copy, textStyle]}>
        <Text style={[styles.eyebrow, { color: item.accent }]}>
          {item.eyebrow}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    backgroundColor: "#e5e7eb",
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
    backgroundColor: "#d1d5db",
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
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 33,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: 0,
    textAlign: "center",
  },
  body: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
