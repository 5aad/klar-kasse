import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { BaseModal } from "@repo/ui";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import { usePostCategoryMutation } from "@/queries/categories";

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
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const postCategoryMutation = usePostCategoryMutation();
  const [categoryName, setCategoryName] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState<(typeof visualIdentifiers)[number]>("airplane");

  const addCategory = () => {
    if (!categoryName.trim()) return;

    const limit = Number(monthlyLimit.replace(",", ".").replace(/[^\d.]/g, ""));

    postCategoryMutation.mutate(
      {
        name: categoryName,
        icon: selectedIcon,
        limit: Number.isFinite(limit) ? limit : 0,
      },
      {
        onSuccess: () => {
          setCategoryName("");
          setMonthlyLimit("");
          setSelectedIcon("airplane");
          onClose();
        },
      },
    );
  };

  return (
    <BaseModal
      backdropStyle={
        resolvedTheme === "dark" ? styles.lightBackdrop : undefined
      }
      contentStyle={[
        styles.modalContent,
        { backgroundColor: themeColors.background },
      ]}
      keyboardAware
      visible={visible}
      onRequestClose={onClose}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>
        New Category
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
        Organize your spending with custom budget limits.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: themeColors.text }]}>
          CATEGORY NAME
        </Text>
        <TextInput
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="e.g. Travel & Leisure"
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
        <Text style={[styles.label, { color: themeColors.text }]}>
          VISUAL IDENTIFIER
        </Text>
        <View style={styles.iconGrid}>
          {visualIdentifiers.map((icon, index) => (
            <Pressable
              key={icon}
              style={[
                styles.iconButton,
                { backgroundColor: themeColors.surface },
                selectedIcon === icon && {
                  backgroundColor: themeColors.primary,
                  borderColor: themeColors.primary,
                },
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <MaterialCommunityIcons
                color={
                  selectedIcon === icon
                    ? themeColors.primaryText
                    : themeColors.text
                }
                name={icon}
                size={24}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: themeColors.text }]}>
          MONTHLY LIMIT
        </Text>
        <TextInput
          value={monthlyLimit}
          onChangeText={setMonthlyLimit}
          keyboardType="decimal-pad"
          placeholder="$ 0.00"
          placeholderTextColor={themeColors.mutedText}
          style={[
            styles.input,
            styles.amountInput,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.text,
              color: themeColors.text,
            },
          ]}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: themeColors.primary }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: themeColors.primary },
            postCategoryMutation.isPending && styles.disabled,
          ]}
          disabled={postCategoryMutation.isPending}
          onPress={addCategory}
        >
          <Text style={[styles.addText, { color: themeColors.primaryText }]}>
            {postCategoryMutation.isPending ? "Adding..." : "Add Category"}
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
  modalContent: {
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  subtitle: {
    maxWidth: 260,
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: "600",
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
    borderWidth: 2,
    borderColor: "transparent",
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
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  addButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
  },
  addText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
});
