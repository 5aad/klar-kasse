import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useSaveUserPreferencesMutation,
  useUserPreferencesQuery,
} from "@/queries/users";
import { useThemeStore, type ThemePreference } from "@/stores/theme-store";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";

const doodles = [
  "face-man-profile",
  "face-woman-profile",
  "emoticon-cool-outline",
  "emoticon-happy-outline",
  "robot-happy-outline",
  "account-star-outline",
] as const;

const themeOptions = [
  {
    key: "light",
    labelKey: "settings.preferences.theme.light",
    icon: "white-balance-sunny",
  },
  {
    key: "dark",
    labelKey: "settings.preferences.theme.dark",
    icon: "moon-waning-crescent",
  },
  {
    key: "system",
    labelKey: "settings.preferences.theme.system",
    icon: "cellphone-cog",
  },
] as const;

export default function PreferencesScreen() {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState("Tom Hillson");
  const [selectedDoodle, setSelectedDoodle] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const selectedTheme = useThemeStore((state) => state.themePreference);
  const setSelectedTheme = useThemeStore((state) => state.setThemePreference);
  const userPreferencesQuery = useUserPreferencesQuery();
  const saveUserPreferencesMutation = useSaveUserPreferencesMutation();
  const doodleTileSize = (width - spacing.lg * 2 - spacing.md * 2) / 3;

  useEffect(() => {
    if (!userPreferencesQuery.data) return;

    setName(userPreferencesQuery.data.name);
    setCurrency(userPreferencesQuery.data.currency);
    setSelectedTheme(userPreferencesQuery.data.appTheme as ThemePreference);
  }, [setSelectedTheme, userPreferencesQuery.data]);

  function saveName() {
    saveUserPreferencesMutation.mutate({ name });
  }

  function saveCurrency() {
    saveUserPreferencesMutation.mutate({ currency });
  }

  function selectTheme(theme: ThemePreference) {
    setSelectedTheme(theme);
    saveUserPreferencesMutation.mutate({ appTheme: theme });
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("settings.preferences.title")}
          subtitle={t("settings.preferences.subtitle")}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("settings.preferences.displayName")}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            placeholder={t("settings.preferences.namePlaceholder")}
            placeholderTextColor={themeColors.mutedText}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.text,
                color: themeColors.text,
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("settings.preferences.profileDoodle")}
          </Text>
          <View style={styles.doodleGrid}>
            {doodles.map((doodle, index) => (
              <Pressable
                key={doodle}
                style={[
                  styles.doodleTile,
                  {
                    width: doodleTileSize,
                    height: doodleTileSize,
                    borderRadius: doodleTileSize / 2,
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.text,
                  },
                  selectedDoodle === index && styles.selectedTile,
                ]}
                onPress={() => setSelectedDoodle(index)}
              >
                <MaterialCommunityIcons
                  color={
                    selectedDoodle === index
                      ? colors.primaryText
                      : themeColors.text
                  }
                  name={doodle}
                  size={54}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("settings.preferences.appTheme")}
          </Text>
          <View style={styles.themeList}>
            {themeOptions.map((option) => {
              const isSelected = selectedTheme === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.text,
                    },
                    isSelected && styles.themeOptionSelected,
                  ]}
                  onPress={() => selectTheme(option.key as ThemePreference)}
                >
                  <MaterialCommunityIcons
                    color={isSelected ? colors.primary : themeColors.text}
                    name={option.icon}
                    size={25}
                  />
                  <Text
                    style={[
                      styles.themeText,
                      { color: themeColors.text },
                      isSelected && styles.themeTextSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  <MaterialCommunityIcons
                    color={isSelected ? colors.primary : themeColors.mutedText}
                    name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                    size={24}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("settings.preferences.currency")}
          </Text>
          <View
            style={[
              styles.preferenceField,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.text,
              },
            ]}
          >
            <View style={styles.preferenceCopy}>
              <Text
                style={[styles.preferenceTitle, { color: themeColors.text }]}
              >
                {t("settings.preferences.currencyCode")}
              </Text>
              <Text
                style={[
                  styles.preferenceDescription,
                  { color: themeColors.mutedText },
                ]}
              >
                {t("settings.preferences.currencyDescription")}
              </Text>
            </View>
            <TextInput
              autoCapitalize="characters"
              maxLength={6}
              value={currency}
              onChangeText={(value) =>
                setCurrency(value.replace(/\s+/g, " ").toUpperCase())
              }
              onBlur={saveCurrency}
              placeholder={t("settings.preferences.currencyPlaceholder")}
              placeholderTextColor={themeColors.mutedText}
              style={[
                styles.preferenceInput,
                {
                  borderColor: themeColors.mutedText,
                  color: themeColors.text,
                },
              ]}
            />
          </View>
        </View>

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  section: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
    backgroundColor: colors.surface,
  },
  doodleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  doodleTile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  selectedTile: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  themeList: {
    gap: spacing.md,
  },
  themeOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
  },
  themeText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  themeTextSelected: {
    color: colors.primary,
  },
  preferenceField: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  preferenceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  preferenceTitle: {
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  preferenceDescription: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    lineHeight: 18,
  },
  preferenceInput: {
    minWidth: 88,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: "800",
    textAlign: "center",
  },
});
