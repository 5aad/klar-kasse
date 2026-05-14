import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
import {
  avatarImageUrls,
  downloadAvatarImage,
  getAvatarFileName,
  isAvatarImageDownloaded,
} from "@/utils/avatar-images";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";

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
  const [name, setName] = useState("set your name");
  const [currency, setCurrency] = useState("EUR");
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [downloadingAvatarUrl, setDownloadingAvatarUrl] = useState<
    string | null
  >(null);
  const [downloadedAvatarUrls, setDownloadedAvatarUrls] = useState<string[]>(
    [],
  );
  const [isRefreshingAvatars, setIsRefreshingAvatars] = useState(false);
  const [avatarPreviewRefreshKey, setAvatarPreviewRefreshKey] = useState(0);
  const selectedTheme = useThemeStore((state) => state.themePreference);
  const setSelectedTheme = useThemeStore((state) => state.setThemePreference);
  const userPreferencesQuery = useUserPreferencesQuery();
  const saveUserPreferencesMutation = useSaveUserPreferencesMutation();
  const avatarTileSize = (width - spacing.lg * 2 - spacing.md * 2) / 3;

  useEffect(() => {
    if (!userPreferencesQuery.data) return;

    setName(userPreferencesQuery.data.name);
    setCurrency(userPreferencesQuery.data.currency);
    setProfileImageUri(userPreferencesQuery.data.profileImageUri);
    setSelectedTheme(userPreferencesQuery.data.appTheme as ThemePreference);
  }, [setSelectedTheme, userPreferencesQuery.data]);

  async function loadDownloadedAvatarUrls() {
    const downloadedUrls = (
      await Promise.all(
        avatarImageUrls.map(async (url) =>
          (await isAvatarImageDownloaded(url)) ? url : null,
        ),
      )
    ).filter((url): url is string => Boolean(url));

    setDownloadedAvatarUrls(downloadedUrls);
  }

  async function refreshAvatarList() {
    setIsRefreshingAvatars(true);

    try {
      await userPreferencesQuery.refetch();
      await loadDownloadedAvatarUrls();
      setAvatarPreviewRefreshKey((currentKey) => currentKey + 1);
    } finally {
      setIsRefreshingAvatars(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDownloadedAvatars() {
      const nextDownloadedUrls = (
        await Promise.all(
          avatarImageUrls.map(async (url) =>
            (await isAvatarImageDownloaded(url)) ? url : null,
          ),
        )
      ).filter((url): url is string => Boolean(url));

      if (isMounted) {
        setDownloadedAvatarUrls(nextDownloadedUrls);
      }
    }

    loadDownloadedAvatars();

    return () => {
      isMounted = false;
    };
  }, []);

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

  async function selectAvatar(url: string) {
    setDownloadingAvatarUrl(url);

    try {
      const localUri = await downloadAvatarImage(url);

      setProfileImageUri(localUri);
      setDownloadedAvatarUrls((currentUrls) =>
        currentUrls.includes(url) ? currentUrls : [...currentUrls, url],
      );
      saveUserPreferencesMutation.mutate({ profileImageUri: localUri });
    } catch (error) {
      console.warn("Avatar download failed:", error);
      Alert.alert(
        t("settings.preferences.avatarDownloadErrorTitle"),
        t("settings.preferences.avatarDownloadErrorBody"),
      );
    } finally {
      setDownloadingAvatarUrl(null);
    }
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
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {t("settings.preferences.profileImage")}
            </Text>
            <Pressable
              accessibilityLabel={t("settings.preferences.refreshAvatars")}
              accessibilityRole="button"
              style={[
                styles.refreshButton,
                { backgroundColor: themeColors.surface },
              ]}
              disabled={isRefreshingAvatars}
              onPress={refreshAvatarList}
            >
              {isRefreshingAvatars ? (
                <ActivityIndicator color={themeColors.text} size="small" />
              ) : (
                <MaterialCommunityIcons
                  color={themeColors.text}
                  name="refresh"
                  size={18}
                />
              )}
            </Pressable>
          </View>
          <View style={styles.avatarGrid}>
            {avatarImageUrls.map((url) => {
              const isSelected = profileImageUri?.endsWith(
                getAvatarFileName(url),
              );
              const isDownloading = downloadingAvatarUrl === url;
              const isDownloaded = downloadedAvatarUrls.includes(url);

              return (
              <Pressable
                key={url}
                style={[
                  styles.avatarTile,
                  {
                    width: avatarTileSize,
                    height: avatarTileSize,
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.text,
                  },
                  isSelected && styles.selectedAvatarTile,
                ]}
                disabled={Boolean(downloadingAvatarUrl)}
                onPress={() => selectAvatar(url)}
              >
                <Image
                  cachePolicy="none"
                  source={{ uri: `${url}?refresh=${avatarPreviewRefreshKey}` }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
                {isDownloaded ? null : (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.avatarTint,
                      {
                        backgroundColor: themeColors.primary,
                        opacity: 0.12,
                      },
                    ]}
                  />
                )}
                {isSelected ? (
                  <View
                    style={[
                      styles.avatarCheck,
                      { backgroundColor: themeColors.primary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={themeColors.primaryText}
                      name="check"
                      size={16}
                    />
                  </View>
                ) : null}
                {isDownloading ? (
                  <View
                    style={[
                      styles.avatarLoading,
                      { backgroundColor: `${themeColors.background}CC` },
                    ]}
                  >
                    <ActivityIndicator color={themeColors.primary} />
                  </View>
                ) : null}
              </Pressable>
              );
            })}
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
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  avatarTile: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  selectedAvatarTile: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarTint: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarCheck: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
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
