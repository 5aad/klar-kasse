import { colors } from "@repo/theme";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type ButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "primary",
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        style={[styles.label, variant === "secondary" && styles.secondaryLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 8,
    minHeight: 56,
    flexDirection: "row",
    gap: 10,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryLabel: {
    color: colors.text,
  },
});
