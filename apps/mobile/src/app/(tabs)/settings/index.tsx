import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerSupportModal } from "@/components/settings/customer-support-modal";
import { LanguageModal } from "@/components/settings/language-modal";
import { useThemeColors } from "@/hooks/use-theme-colors";

type ThemeColors = ReturnType<typeof useThemeColors>;

const PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80";

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.profile}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: PROFILE_IMAGE }} style={styles.avatar} />
        </View>
        <Text style={[styles.name, { color: themeColors.text }]}>
          Tom Hillson
        </Text>
        {/* <Text style={styles.email}>Tomhill@mail.com</Text> */}
      </View>

      <View style={styles.menu}>
        <SettingsRow
          icon="cog-outline"
          label="Preferences"
          themeColors={themeColors}
          onPress={() => router.push("/settings/preferences")}
        />
        <SettingsRow
          icon="database-outline"
          label="Your Data"
          themeColors={themeColors}
          onPress={() => router.push("/settings/your-data")}
        />
        <SettingsRow
          icon="translate"
          label="Language"
          themeColors={themeColors}
          onPress={() => setIsLanguageModalVisible(true)}
        />
        <SettingsRow
          icon="help-circle-outline"
          label="Customer Support"
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
    width: 108,
    height: 108,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 54,
    backgroundColor: colors.surface,
  },
  name: {
    marginTop: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: "800",
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
