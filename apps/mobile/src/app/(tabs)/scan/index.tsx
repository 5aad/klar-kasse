import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

const actions = [
  {
    titleKey: "scan.home.actions.scan.title",
    subtitleKey: "scan.home.actions.scan.subtitle",
    icon: "line-scan",
    route: "/scan/scan-receipt",
  },
  {
    titleKey: "scan.home.actions.manual.title",
    subtitleKey: "scan.home.actions.manual.subtitle",
    icon: "pencil-plus-outline",
    route: "/scan/add-receipt",
  },
] as const;

export default function ScanHomeScreen() {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          {
            alignSelf: "center",
            maxWidth: adaptive.maxFormWidth,
            paddingBottom: getTabScreenBottomPadding(bottom, 36),
            paddingHorizontal: adaptive.gutter,
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
            {t("scan.home.eyebrow")}
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("scan.home.title")}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
            {t("scan.home.subtitle")}
          </Text>
        </View>

        <View
          style={[
            styles.actionList,
            adaptive.isMedium && styles.actionListGrid,
          ]}
        >
          {actions.map((action) => (
            <Pressable
              key={action.route}
              style={[
                styles.actionCard,
                adaptive.isMedium && styles.actionCardWide,
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
                  {t(action.titleKey)}
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: themeColors.mutedText },
                  ]}
                >
                  {t(action.subtitleKey)}
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
      </KeyboardAwareScrollView>
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
    fontWeight: "600",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 21,
  },
  actionList: {
    gap: spacing.md,
  },
  actionListGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  actionCardWide: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
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
    fontWeight: "600",
  },
  actionSubtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 20,
  },
});
