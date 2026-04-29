import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type DotProps = {
  index: number;
  scrollX: Animated.Value;
};

function PaginationDot({ index, scrollX }: DotProps) {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const dotStyle = {
    width: scrollX.interpolate({
      inputRange,
      outputRange: [10, 34, 10],
      extrapolate: "clamp",
    }),
    backgroundColor: scrollX.interpolate({
      inputRange,
      outputRange: [
        themeColors.mutedText,
        themeColors.primary,
        themeColors.mutedText,
      ],
      extrapolate: "clamp",
    }),
  };

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

type Props = {
  length: number;
  scrollX: Animated.Value;
};

export function OnboardingPagination({ length, scrollX }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <PaginationDot index={index} key={index} scrollX={scrollX} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
