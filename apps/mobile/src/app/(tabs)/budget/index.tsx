import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NewCategoryModal } from "@/components/budget/new-category-modal";
import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

type CategoryBudget = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  name: string;
  type: string;
  spent: number;
  limit: number;
  action: string;
  alert?: string;
};

const categoryBudgets: CategoryBudget[] = [
  {
    icon: "home",
    name: "Housing",
    type: "FIXED EXPENSE",
    spent: 1200,
    limit: 1500,
    action: "Edit Budget",
  },
  {
    icon: "cart",
    name: "Groceries",
    type: "VARIABLE EXPENSE",
    spent: 740,
    limit: 800,
    action: "Edit Budget",
    alert: "Warning: 90% limit reached",
  },
  {
    icon: "silverware-fork-knife",
    name: "Dining",
    type: "LIFESTYLE",
    spent: 450,
    limit: 1000,
    action: "Set Limit",
  },
  {
    icon: "movie-open",
    name: "Entertainment",
    type: "LEISURE",
    spent: 120,
    limit: 500,
    action: "Edit Budget",
  },
  {
    icon: "car",
    name: "Transport",
    type: "COMMUTE",
    spent: 260,
    limit: 400,
    action: "Edit Budget",
  },
  {
    icon: "shopping",
    name: "Shopping",
    type: "PERSONAL",
    spent: 380,
    limit: 600,
    action: "Edit Budget",
  },
  {
    icon: "heart-pulse",
    name: "Health",
    type: "WELLNESS",
    spent: 95,
    limit: 300,
    action: "Set Limit",
  },
] as const;

export default function BudgetScreen() {
  const themeColors = useThemeColors();
  const [isNewCategoryModalVisible, setIsNewCategoryModalVisible] =
    useState(false);
  const totalBudget = 5000;
  const totalSpent = 3250;
  const totalProgress = totalSpent / totalBudget;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Budget
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
            Track spending across every category.
          </Text>
        </View>

        <View
          style={[styles.statusCard, { backgroundColor: themeColors.surface }]}
        >
          <View
            style={[
              styles.statusAccent,
              { backgroundColor: themeColors.primary },
            ]}
          />
          <Text style={[styles.cardEyebrow, { color: themeColors.mutedText }]}>
            TOTAL BUDGET STATUS
          </Text>
          <Text style={[styles.percent, { color: themeColors.text }]}>65%</Text>
          <Text style={[styles.statusCopy, { color: themeColors.mutedText }]}>
            of your{" "}
            <Text style={[styles.strong, { color: themeColors.text }]}>
              $5,000
            </Text>{" "}
            monthly budget used
          </Text>

          <View style={styles.statusAmounts}>
            <Text
              style={[styles.primaryAmount, { color: themeColors.primary }]}
            >
              $3,250 spent
            </Text>
            <Text
              style={[styles.secondaryAmount, { color: themeColors.mutedText }]}
            >
              $1,750 left
            </Text>
          </View>
          <ProgressBar
            fillColor={themeColors.primary}
            progress={totalProgress}
            trackColor={themeColors.text}
          />
        </View>

        <View style={styles.categoryHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Category Budgets
          </Text>
          <Pressable
            style={[styles.addButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setIsNewCategoryModalVisible(true)}
          >
            <MaterialCommunityIcons
              color={themeColors.primaryText}
              name="plus-circle"
              size={18}
            />
            <Text
              style={[styles.addButtonText, { color: themeColors.primaryText }]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {categoryBudgets.map((budget) => (
            <CategoryBudgetCard key={budget.name} budget={budget} />
          ))}
        </View>
      </ScrollView>
      <NewCategoryModal
        visible={isNewCategoryModalVisible}
        onClose={() => setIsNewCategoryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function ProgressBar({
  progress,
  fillColor,
  trackColor,
}: {
  fillColor: string;
  progress: number;
  trackColor: string;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${progress * 100}%`, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

function CategoryBudgetCard({ budget }: { budget: CategoryBudget }) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const remaining = budget.limit - budget.spent;
  const progress = budget.spent / budget.limit;
  const isAlert = Boolean(budget.alert);
  const cardBackground =
    resolvedTheme === "dark" ? themeColors.surface : themeColors.text;
  const cardText =
    resolvedTheme === "dark" ? themeColors.text : themeColors.primaryText;
  const cardMutedText =
    resolvedTheme === "dark" ? themeColors.mutedText : themeColors.background;

  return (
    <View
      style={[
        styles.categoryCard,
        { backgroundColor: cardBackground },
        isAlert && styles.alertCard,
        isAlert && { borderColor: themeColors.primary },
      ]}
    >
      <View style={styles.categoryTopRow}>
        <View
          style={[
            styles.categoryIconBox,
            {
              backgroundColor: "#101010",
            },
          ]}
        >
          <MaterialCommunityIcons
            color={isAlert ? themeColors.primary : themeColors.primaryText}
            name={budget.icon}
            size={25}
          />
        </View>
        <View style={styles.categoryCopy}>
          <Text style={[styles.categoryName, { color: cardText }]}>
            {budget.name}
          </Text>
          <Text style={[styles.categoryType, { color: cardMutedText }]}>
            {budget.type}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (budget.action === "Edit Budget") {
              router.push({
                pathname: "/budget/edit-budget",
                params: {
                  icon: budget.icon,
                  limit: String(budget.limit),
                  name: budget.name,
                  spent: String(budget.spent),
                  type: budget.type,
                },
              });
            }
          }}
        >
          <Text
            style={[
              styles.categoryAction,
              { color: isAlert ? themeColors.primary : cardText },
            ]}
          >
            {budget.action}
          </Text>
        </Pressable>
      </View>

      <View style={styles.categoryAmounts}>
        <Text style={[styles.categorySpent, { color: cardMutedText }]}>
          ${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}
        </Text>
        <Text
          style={[
            styles.categoryRemaining,
            { color: isAlert ? themeColors.primary : cardText },
          ]}
        >
          ${remaining.toLocaleString()} remaining
        </Text>
      </View>
      <ProgressBar
        fillColor={isAlert ? themeColors.primary : cardText}
        progress={progress}
        trackColor={themeColors.mutedText}
      />

      {budget.alert ? (
        <View
          style={[
            styles.warningPill,
            { backgroundColor: `${themeColors.primary}26` },
          ]}
        >
          <MaterialCommunityIcons
            color={themeColors.primary}
            name="alert"
            size={15}
          />
          <Text style={[styles.warningText, { color: themeColors.primary }]}>
            {budget.alert}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  statusCard: {
    overflow: "hidden",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.28)",
  },
  statusAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
  },
  cardEyebrow: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    letterSpacing: 2,
  },
  percent: {
    fontSize: 46,
    fontWeight: "700",
  },
  statusCopy: {
    maxWidth: 230,
    fontSize: fontSize.lg,
    fontWeight: "500",
    lineHeight: 23,
  },
  strong: {},
  statusAmounts: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryAmount: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  secondaryAmount: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  progressTrack: {
    height: 12,
    overflow: "hidden",
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: "700",
    lineHeight: 29,
  },
  addButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  alertCard: {
    borderWidth: 1.5,
  },
  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  categoryIconBox: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  categoryType: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  categoryAction: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  categoryAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  categorySpent: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  categoryRemaining: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  warningPill: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: 999,
  },
  warningText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
