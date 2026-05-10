import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type Props = {
  body: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
};

export function EmptyStateCard({
  body,
  icon = "information-outline",
  title,
}: Props) {
  const themeColors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
      <View style={[styles.iconBox, { backgroundColor: themeColors.text }]}>
        <MaterialCommunityIcons
          color={themeColors.background}
          name={icon}
          size={24}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.body, { color: themeColors.mutedText }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  iconBox: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 20,
  },
});
