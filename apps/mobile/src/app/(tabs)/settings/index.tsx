import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { CustomerSupportModal } from "@/components/settings/customer-support-modal";
import { LanguageModal } from "@/components/settings/language-modal";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useUserPreferencesQuery } from "@/queries/users";
import { useReceiptLlmRuntimeStore } from "@/stores/receipt-llm-runtime-store";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type ThemeColors = ReturnType<typeof useThemeColors>;

const PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80";

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const userPreferencesQuery = useUserPreferencesQuery();
  const receiptLlmBackend = useReceiptLlmRuntimeStore(
    (state) => state.backend,
  );
  const receiptLlmDownloadProgress = useReceiptLlmRuntimeStore(
    (state) => state.downloadProgress,
  );
  const receiptLlmError = useReceiptLlmRuntimeStore((state) => state.error);
  const isReceiptLlmGenerating = useReceiptLlmRuntimeStore(
    (state) => state.isGenerating,
  );
  const isReceiptLlmReady = useReceiptLlmRuntimeStore(
    (state) => state.isReady,
  );
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: themeColors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            alignSelf: "center",
            maxWidth: adaptive.maxContentWidth,
            paddingBottom: getTabScreenBottomPadding(bottom, spacing.xl),
            paddingHorizontal: adaptive.gutter,
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.settingsGrid,
            adaptive.isExpanded && styles.settingsGridWide,
          ]}
        >
          <View
            style={[styles.profile, adaptive.isExpanded && styles.profileWide]}
          >
            <View style={styles.avatarWrap}>
              <Image
                contentFit="cover"
                source={{
                  uri:
                    userPreferencesQuery.data?.profileImageUri ?? PROFILE_IMAGE,
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={[styles.name, { color: themeColors.text }]}>
              {userPreferencesQuery.data?.name ?? "set your name"}
            </Text>
            <ReceiptLlmStatusPills
              backend={receiptLlmBackend}
              downloadProgress={receiptLlmDownloadProgress}
              error={receiptLlmError}
              isGenerating={isReceiptLlmGenerating}
              isReady={isReceiptLlmReady}
              themeColors={themeColors}
            />
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
              icon="shield-lock-outline"
              label={t("settings.menu.privacyPolicy")}
              themeColors={themeColors}
              onPress={() => router.push("/settings/privacy-policy")}
            />
            <SettingsRow
              icon="file-document-outline"
              label={t("settings.menu.termsOfUse")}
              themeColors={themeColors}
              onPress={() => router.push("/settings/terms-of-use")}
            />
            <SettingsRow
              icon="help-circle-outline"
              label={t("settings.menu.customerSupport")}
              themeColors={themeColors}
              onPress={() => setIsSupportModalVisible(true)}
            />
          </View>
        </View>
      </ScrollView>

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

type ReceiptLlmStatusPillsProps = {
  backend: string;
  downloadProgress: number;
  error: string | null;
  isGenerating: boolean;
  isReady: boolean;
  themeColors: ThemeColors;
};

function ReceiptLlmStatusPills({
  backend,
  downloadProgress,
  error,
  isGenerating,
  isReady,
  themeColors,
}: ReceiptLlmStatusPillsProps) {
  const progressPercent = Math.round(downloadProgress * 100);
  const readinessLabel = error
    ? "LLM paused"
    : isGenerating
      ? "LLM working"
      : isReady
        ? "LLM ready"
        : "LLM loading";
  const readinessIcon = error
    ? "alert-circle-outline"
    : isGenerating
      ? "brain"
      : isReady
        ? "check-circle-outline"
        : "progress-download";

  return (
    <View style={styles.llmPillRow}>
      <StatusPill
        icon={readinessIcon}
        label={readinessLabel}
        tone={error ? "muted" : isReady ? "ready" : "loading"}
        themeColors={themeColors}
      />
      <StatusPill
        icon="chip"
        label={`Backend ${backend.toUpperCase()}`}
        tone="muted"
        themeColors={themeColors}
      />
      <StatusPill
        icon={downloadProgress >= 1 ? "cloud-check-outline" : "download"}
        label={`Model ${progressPercent}%`}
        tone={downloadProgress >= 1 ? "ready" : "loading"}
        themeColors={themeColors}
      />
    </View>
  );
}

type StatusPillProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  themeColors: ThemeColors;
  tone: "loading" | "muted" | "ready";
};

function StatusPill({ icon, label, themeColors, tone }: StatusPillProps) {
  const isReadyTone = tone === "ready";

  return (
    <View
      style={[
        styles.llmPill,
        {
          backgroundColor: isReadyTone
            ? `${themeColors.primary}18`
            : themeColors.surface,
          borderColor: isReadyTone
            ? `${themeColors.primary}66`
            : themeColors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        color={isReadyTone ? themeColors.primary : themeColors.mutedText}
        name={icon}
        size={14}
      />
      <Text
        style={[
          styles.llmPillText,
          { color: isReadyTone ? themeColors.primary : themeColors.mutedText },
        ]}
      >
        {label}
      </Text>
    </View>
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
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  settingsGrid: {
    gap: spacing.xl,
  },
  settingsGridWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profile: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: 44,
  },
  profileWide: {
    width: 300,
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
  llmPillRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
  },
  llmPill: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  llmPillText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  email: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  menu: {
    flex: 1,
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
