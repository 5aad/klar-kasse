import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import {
  getCurrentLanguage,
  setAppLanguage,
  type SupportedLanguage,
} from "@/i18n";

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function LanguageModal({ onClose, visible }: Props) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>(getCurrentLanguage);

  useEffect(() => {
    if (visible) {
      setSelectedLanguage(getCurrentLanguage());
    }
  }, [visible]);

  const saveLanguage = () => {
    void setAppLanguage(selectedLanguage).then(onClose);
  };

  return (
    <BaseModal
      backdropStyle={
        resolvedTheme === "dark" ? styles.lightBackdrop : undefined
      }
      contentStyle={{ backgroundColor: themeColors.background }}
      visible={visible}
      onRequestClose={onClose}
    >
      <Text style={[styles.modalTitle, { color: themeColors.text }]}>
        {t("settings.language.title")}
      </Text>
      <Text style={[styles.modalBody, { color: themeColors.mutedText }]}>
        {t("settings.language.body")}
      </Text>

      <View style={styles.languageOptions}>
        <LanguageOption
          label={t("settings.language.english")}
          selected={selectedLanguage === "en"}
          themeColors={themeColors}
          onPress={() => setSelectedLanguage("en")}
        />
        <LanguageOption
          label={t("settings.language.german")}
          selected={selectedLanguage === "de"}
          themeColors={themeColors}
          onPress={() => setSelectedLanguage("de")}
        />
      </View>

      <View style={styles.modalActions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: themeColors.primary }]}>
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={saveLanguage}
        >
          <Text style={[styles.submitText, { color: themeColors.primaryText }]}>
            {t("common.save")}
          </Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}

type LanguageOptionProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
  themeColors: ReturnType<typeof useThemeColors>;
};

function LanguageOption({
  label,
  onPress,
  selected,
  themeColors,
}: LanguageOptionProps) {
  return (
    <Pressable
      style={[
        styles.languageOption,
        {
          backgroundColor: themeColors.surface,
          borderColor: selected ? themeColors.primary : themeColors.text,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.languageOptionText,
          { color: selected ? themeColors.primary : themeColors.text },
        ]}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        color={selected ? themeColors.primary : themeColors.mutedText}
        name={selected ? "radiobox-marked" : "radiobox-blank"}
        size={24}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lightBackdrop: {
    backgroundColor: "rgba(242, 240, 234, 0.42)",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  modalBody: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    fontWeight: "700",
    lineHeight: 20,
  },
  languageOptions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  languageOption: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
  },
  languageOptionText: {
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  submitButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingHorizontal: spacing.lg,
  },
  submitText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
