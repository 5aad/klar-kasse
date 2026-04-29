import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function LanguageModal({ onClose, visible }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "de">("en");

  return (
    <BaseModal visible={visible} onRequestClose={onClose}>
      <Text style={styles.modalTitle}>Language</Text>
      <Text style={styles.modalBody}>Choose your preferred app language.</Text>

      <View style={styles.languageOptions}>
        <LanguageOption
          label="English"
          selected={selectedLanguage === "en"}
          onPress={() => setSelectedLanguage("en")}
        />
        <LanguageOption
          label="Deutsch"
          selected={selectedLanguage === "de"}
          onPress={() => setSelectedLanguage("de")}
        />
      </View>

      <View style={styles.modalActions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={onClose}>
          <Text style={styles.submitText}>Save</Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}

type LanguageOptionProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

function LanguageOption({ label, onPress, selected }: LanguageOptionProps) {
  return (
    <Pressable
      style={[styles.languageOption, selected && styles.languageOptionSelected]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.languageOptionText,
          selected && styles.languageOptionTextSelected,
        ]}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        color={selected ? colors.primary : colors.mutedText}
        name={selected ? "radiobox-marked" : "radiobox-blank"}
        size={24}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "900",
  },
  modalBody: {
    marginTop: spacing.xs,
    color: colors.mutedText,
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
    borderColor: colors.text,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  languageOptionSelected: {
    borderColor: colors.primary,
  },
  languageOptionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  languageOptionTextSelected: {
    color: colors.primary,
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
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "900",
  },
  submitButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
  },
  submitText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "900",
  },
});
