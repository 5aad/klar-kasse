import { fontSize, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function CustomerSupportModal({ onClose, visible }: Props) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();

  return (
    <BaseModal
      backdropStyle={
        resolvedTheme === "dark" ? styles.lightBackdrop : undefined
      }
      contentStyle={{ backgroundColor: themeColors.background }}
      keyboardAware
      visible={visible}
      onRequestClose={onClose}
    >
      <Text style={[styles.modalTitle, { color: themeColors.text }]}>
        Customer Support
      </Text>
      <Text style={[styles.modalBody, { color: themeColors.mutedText }]}>
        Send us a message and we will get back to you.
      </Text>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
            NAME
          </Text>
          <TextInput
            placeholder="Your name"
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

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
            EMAIL
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
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

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
            MESSAGE
          </Text>
          <TextInput
            multiline
            placeholder="How can we help?"
            placeholderTextColor={themeColors.mutedText}
            style={[
              styles.input,
              styles.messageInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.text,
                color: themeColors.text,
              },
            ]}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.modalActions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: themeColors.primary }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={onClose}
        >
          <Text style={[styles.submitText, { color: themeColors.primaryText }]}>
            Submit
          </Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  lightBackdrop: {
    backgroundColor: "rgba(242, 240, 234, 0.42)",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "900",
  },
  modalBody: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    fontWeight: "700",
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: "900",
    letterSpacing: 1,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  messageInput: {
    minHeight: 112,
    paddingTop: spacing.md,
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
    fontWeight: "900",
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
    fontWeight: "900",
  },
});
