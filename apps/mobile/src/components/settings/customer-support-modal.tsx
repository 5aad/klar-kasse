import { fontSize, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { submitSupportTicket } from "@/api/support-tickets";
import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function CustomerSupportModal({ onClose, visible }: Props) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTicket = async () => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await submitSupportTicket({ email, message, name });
      setName("");
      setEmail("");
      setMessage("");
      onClose();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {t("settings.customerSupport.title")}
      </Text>
      <Text style={[styles.modalBody, { color: themeColors.mutedText }]}>
        {t("settings.customerSupport.body")}
      </Text>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
            {t("settings.customerSupport.name")}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("settings.customerSupport.namePlaceholder")}
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
            {t("settings.customerSupport.email")}
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
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
            {t("settings.customerSupport.message")}
          </Text>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder={t("settings.customerSupport.messagePlaceholder")}
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

      {statusMessage ? (
        <Text style={[styles.statusText, { color: themeColors.primary }]}>
          {statusMessage}
        </Text>
      ) : null}

      <View style={styles.modalActions}>
        <Pressable
          style={styles.cancelButton}
          disabled={isSubmitting}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: themeColors.primary }]}>
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.primary },
            (!message.trim() || isSubmitting) && styles.disabled,
          ]}
          disabled={!message.trim() || isSubmitting}
          onPress={submitTicket}
        >
          <Text style={[styles.submitText, { color: themeColors.primaryText }]}>
            {isSubmitting ? t("common.saving") : t("common.submit")}
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
    fontWeight: "700",
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
    fontWeight: "700",
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
  statusText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: "700",
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
  disabled: {
    opacity: 0.55,
  },
});
