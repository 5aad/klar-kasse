import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const visualIdentifiers = [
  "airplane",
  "bag-suitcase",
  "movie-open",
  "silverware-fork-knife",
  "paw",
  "school",
] as const;

type Props = {
  onClose: () => void;
  visible: boolean;
};

export function NewCategoryModal({ onClose, visible }: Props) {
  return (
    <BaseModal
      contentStyle={styles.modalContent}
      visible={visible}
      onRequestClose={onClose}
    >
      <Text style={styles.title}>New Category</Text>
      <Text style={styles.subtitle}>
        Organize your spending with custom budget limits.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>CATEGORY NAME</Text>
        <TextInput
          placeholder="e.g. Travel & Leisure"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>VISUAL IDENTIFIER</Text>
        <View style={styles.iconGrid}>
          {visualIdentifiers.map((icon, index) => (
            <Pressable
              key={icon}
              style={[styles.iconButton, index === 0 && styles.iconSelected]}
            >
              <MaterialCommunityIcons
                color={index === 0 ? colors.primaryText : colors.text}
                name={icon}
                size={24}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>MONTHLY LIMIT</Text>
        <TextInput
          keyboardType="decimal-pad"
          placeholder="$ 0.00"
          placeholderTextColor={colors.mutedText}
          style={[styles.input, styles.amountInput]}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.addButton} onPress={onClose}>
          <Text style={styles.addText}>Add Category</Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  subtitle: {
    maxWidth: 260,
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
    backgroundColor: colors.surface,
  },
  amountInput: {
    fontSize: fontSize.xl,
  },
  iconGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  iconSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  cancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  addButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
  },
  addText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
