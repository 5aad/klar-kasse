import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomerSupportModal } from "@/components/settings/customer-support-modal";
import { LanguageModal } from "@/components/settings/language-modal";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useUserPreferencesQuery } from "@/queries/users";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type ThemeColors = ReturnType<typeof useThemeColors>;

const PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80";

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const userPreferencesQuery = useUserPreferencesQuery();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: themeColors.background,
          paddingBottom: getTabScreenBottomPadding(bottom, 0),
        },
      ]}
    >
      <View style={styles.profile}>
        <View style={styles.avatarWrap}>
          <Image
          contentFit="cover"
            source={{
              uri: userPreferencesQuery.data?.profileImageUri ?? PROFILE_IMAGE,
            }}
            style={styles.avatar}
          />
        </View>
        <Text style={[styles.name, { color: themeColors.text }]}>
          {userPreferencesQuery.data?.name ?? "set your name"}
        </Text>
        {/* <Text style={styles.email}>Tomhill@mail.com</Text> */}
      </View>

      <View style={styles.menu}>
        <SettingsRow
          icon="cog-outline"
          label={t("settings.menu.preferences")}
          themeColors={themeColors}
          onPress={() => router.push("/settings/preferences")}
        />
        <SettingsRow
          icon="database-outline"
          label={t("settings.menu.yourData")}
          themeColors={themeColors}
          onPress={() => router.push("/settings/your-data")}
        />
        <SettingsRow
          icon="translate"
          label={t("settings.menu.language")}
          themeColors={themeColors}
          onPress={() => setIsLanguageModalVisible(true)}
        />
        <SettingsRow
          icon="help-circle-outline"
          label={t("settings.menu.customerSupport")}
          themeColors={themeColors}
          onPress={() => setIsSupportModalVisible(true)}
        />
      </View>

      <CustomerSupportModal
        visible={isSupportModalVisible}
        onClose={() => setIsSupportModalVisible(false)}
      />
      <LanguageModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
    </SafeAreaView>
  );
}

type SettingsRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  themeColors: ThemeColors;
};

function SettingsRow({
  icon,
  label,
  onPress,
  showChevron = true,
  themeColors,
}: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={30} color={themeColors.text} />
      <Text style={[styles.rowLabel, { color: themeColors.text }]}>
        {label}
      </Text>
      {showChevron ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={25}
          color={themeColors.mutedText}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  profile: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: 44,
  },
  avatarWrap: {
    width: 150,
    height: 150,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  name: {
    marginTop: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: "600",
  },
  email: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  menu: {
    gap: spacing.lg,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
});
