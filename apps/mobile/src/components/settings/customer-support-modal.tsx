import { colors, fontSize, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function CustomerSupportModal({ onClose, visible }: Props) {
  return (
    <BaseModal visible={visible} onRequestClose={onClose}>
      <Text style={styles.modalTitle}>Customer Support</Text>
      <Text style={styles.modalBody}>
        Send us a message and we will get back to you.
      </Text>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MESSAGE</Text>
          <TextInput
            multiline
            placeholder="How can we help?"
            placeholderTextColor={colors.mutedText}
            style={[styles.input, styles.messageInput]}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.modalActions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={onClose}>
          <Text style={styles.submitText}>Submit</Text>
        </Pressable>
      </View>
    </BaseModal>
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
  form: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "900",
    letterSpacing: 1,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "700",
    backgroundColor: colors.surface,
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
