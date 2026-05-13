import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useThemeStore, type ThemePreference } from "@/stores/theme-store";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

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

const currencyOptions = [
  {
    key: "EUR",
    labelKey: "settings.preferences.currencyOptions.eur",
    icon: "currency-eur",
  },
  {
    key: "USD",
    labelKey: "settings.preferences.currencyOptions.usd",
    icon: "currency-usd",
  },
  {
    key: "GBP",
    labelKey: "settings.preferences.currencyOptions.gbp",
    icon: "currency-gbp",
  },
] as const;

export default function PreferencesScreen() {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState("Tom Hillson");
  const [selectedDoodle, setSelectedDoodle] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");
  const [vatRate, setVatRate] = useState("19");
  const selectedTheme = useThemeStore((state) => state.themePreference);
  const setSelectedTheme = useThemeStore((state) => state.setThemePreference);
  const doodleTileSize = (width - spacing.lg * 2 - spacing.md * 2) / 3;
  const updateVatRate = (value: string) => {
    setVatRate(value.replace(",", ".").replace(/[^\d.]/g, ""));
  };

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
                  onPress={() =>
                    setSelectedTheme(option.key as ThemePreference)
                  }
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
          <View style={styles.themeList}>
            {currencyOptions.map((option) => {
              const isSelected = selectedCurrency === option.key;

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
                  onPress={() => setSelectedCurrency(option.key)}
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
            {t("settings.preferences.vat")}
          </Text>
          <View
            style={[
              styles.vatRateField,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.text,
              },
            ]}
          >
            <View style={styles.vatRateCopy}>
              <Text style={[styles.vatRateLabel, { color: themeColors.text }]}>
                {t("settings.preferences.vatRate")}
              </Text>
              <Text
                style={[
                  styles.vatRateDescription,
                  { color: themeColors.mutedText },
                ]}
              >
                {t("settings.preferences.vatRateDescription")}
              </Text>
            </View>
            <View
              style={[
                styles.vatRateInputWrap,
                { borderColor: themeColors.mutedText },
              ]}
            >
              <TextInput
                keyboardType="decimal-pad"
                value={vatRate}
                onChangeText={updateVatRate}
                placeholder={t("settings.preferences.vatRatePlaceholder")}
                placeholderTextColor={themeColors.mutedText}
                style={[styles.vatRateInput, { color: themeColors.text }]}
              />
              <Text
                style={[styles.vatRateSuffix, { color: themeColors.mutedText }]}
              >
                %
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  vatRateField: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  vatRateCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vatRateLabel: {
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  vatRateDescription: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    lineHeight: 18,
  },
  vatRateInputWrap: {
    minWidth: 88,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  vatRateInput: {
    minWidth: 42,
    padding: 0,
    fontSize: fontSize.lg,
    fontWeight: "800",
    textAlign: "right",
  },
  vatRateSuffix: {
    marginLeft: 2,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
});
