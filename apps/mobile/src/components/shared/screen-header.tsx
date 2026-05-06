import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type Props = {
  onBack?: () => void;
  subtitle?: string;
  title: string;
};

export function ScreenHeader({ onBack, subtitle, title }: Props) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.header}>
      <Pressable
        style={[styles.backButton, { backgroundColor: themeColors.surface }]}
        onPress={onBack ?? (() => router.back())}
      >
        <MaterialCommunityIcons
          color={themeColors.text}
          name="chevron-left"
          size={28}
        />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
});
