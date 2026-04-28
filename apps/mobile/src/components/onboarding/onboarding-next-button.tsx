import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@repo/theme";
import { Animated, Pressable, StyleSheet } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  disabled: boolean;
  length: number;
  onPress: () => void;
  pageIndex: number;
  progress: Animated.Value;
  width: number;
};

export function OnboardingNextButton({
  disabled,
  length,
  onPress,
  pageIndex,
  progress,
  width,
}: Props) {
  const inputRange = Array.from({ length }).map((_, index) => index * width);
  const buttonWidths = Array.from({ length }).map((_, index) =>
    index === length - 1 ? 154 : 62,
  );
  const lastPageStates = Array.from({ length }).map((_, index) =>
    index === length - 1 ? 1 : 0,
  );

  const buttonStyle = {
    width: progress.interpolate({
      inputRange,
      outputRange: buttonWidths,
      extrapolate: "clamp",
    }),
  };

  const textStyle = {
    opacity: progress.interpolate({
      inputRange,
      outputRange: lastPageStates,
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange,
          outputRange: Array.from({ length }).map((_, index) =>
            index === length - 1 ? 0 : 42,
          ),
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const iconStyle = {
    opacity: progress.interpolate({
      inputRange,
      outputRange: lastPageStates.map((value) => 1 - value),
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange,
          outputRange: Array.from({ length }).map((_, index) =>
            index === length - 1 ? -42 : 0,
          ),
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <AnimatedPressable
      accessibilityLabel={
        pageIndex === length - 1 ? "Get started" : "Next onboarding page"
      }
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.button, buttonStyle, disabled && styles.disabled]}
      onPress={onPress}
    >
      <Animated.View style={[styles.icon, iconStyle]}>
        <MaterialCommunityIcons
          color={colors.primaryText}
          name="arrow-right"
          size={25}
        />
      </Animated.View>
      <Animated.Text style={[styles.text, textStyle]}>
        {disabled ? "Starting" : "Get Started"}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  icon: {
    position: "absolute",
  },
  text: {
    position: "absolute",
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
  },
  disabled: {
    opacity: 0.62,
  },
});
