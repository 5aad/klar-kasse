import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

const actions = [
  {
    title: "Scan receipt",
    subtitle: "Use the camera or choose a receipt photo.",
    icon: "line-scan",
    route: "/scan/scan-receipt",
  },
  {
    title: "Add manually",
    subtitle: "Enter merchant, total, category, and items.",
    icon: "pencil-plus-outline",
    route: "/scan/add-receipt",
  },
] as const;

export default function ScanHomeScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
            NEW RECORD
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Add Spending
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
            Capture a receipt automatically or add the details yourself.
          </Text>
        </View>

        <View style={styles.actionList}>
          {actions.map((action) => (
            <Pressable
              key={action.title}
              style={[
                styles.actionCard,
                { backgroundColor: themeColors.surface },
              ]}
              onPress={() => router.navigate(action.route)}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: themeColors.text },
                ]}
              >
                <MaterialCommunityIcons
                  color={themeColors.background}
                  name={action.icon}
                  size={30}
                />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: themeColors.text }]}>
                  {action.title}
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: themeColors.mutedText },
                  ]}
                >
                  {action.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons
                color={themeColors.mutedText}
                name="chevron-right"
                size={25}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 21,
  },
  actionList: {
    gap: spacing.md,
  },
  actionCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  actionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  actionSubtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 20,
  },
});
