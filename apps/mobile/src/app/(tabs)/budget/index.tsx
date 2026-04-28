import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NewCategoryModal } from "@/components/budget/new-category-modal";

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
  const [isNewCategoryModalVisible, setIsNewCategoryModalVisible] =
    useState(false);
  const totalBudget = 5000;
  const totalSpent = 3250;
  const totalProgress = totalSpent / totalBudget;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>
            Track spending across every category.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusAccent} />
          <Text style={styles.cardEyebrow}>TOTAL BUDGET STATUS</Text>
          <Text style={styles.percent}>65%</Text>
          <Text style={styles.statusCopy}>
            of your <Text style={styles.strong}>$5,000</Text> monthly budget
            used
          </Text>

          <View style={styles.statusAmounts}>
            <Text style={styles.primaryAmount}>$3,250 spent</Text>
            <Text style={styles.secondaryAmount}>$1,750 left</Text>
          </View>
          <ProgressBar progress={totalProgress} />
        </View>

        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setIsNewCategoryModalVisible(true)}
          >
            <MaterialCommunityIcons
              color={colors.primaryText}
              name="plus-circle"
              size={18}
            />
            <Text style={styles.addButtonText}>Add</Text>
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
  fillColor = colors.primary,
}: {
  progress: number;
  fillColor?: string;
}) {
  return (
    <View style={styles.progressTrack}>
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
  const remaining = budget.limit - budget.spent;
  const progress = budget.spent / budget.limit;
  const isAlert = Boolean(budget.alert);

  return (
    <View style={[styles.categoryCard, isAlert && styles.alertCard]}>
      <View style={styles.categoryTopRow}>
        <View style={[styles.categoryIconBox, isAlert && styles.alertIconBox]}>
          <MaterialCommunityIcons
            color={isAlert ? colors.primary : colors.primaryText}
            name={budget.icon}
            size={25}
          />
        </View>
        <View style={styles.categoryCopy}>
          <Text style={styles.categoryName}>{budget.name}</Text>
          <Text style={styles.categoryType}>{budget.type}</Text>
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
              !isAlert && styles.categoryActionLight,
            ]}
          >
            {budget.action}
          </Text>
        </Pressable>
      </View>

      <View style={styles.categoryAmounts}>
        <Text style={styles.categorySpent}>
          ${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}
        </Text>
        <Text
          style={[
            styles.categoryRemaining,
            !isAlert && styles.categoryRemainingLight,
          ]}
        >
          ${remaining.toLocaleString()} remaining
        </Text>
      </View>
      <ProgressBar
        fillColor={isAlert ? colors.primary : colors.primaryText}
        progress={progress}
      />

      {budget.alert ? (
        <View style={styles.warningPill}>
          <MaterialCommunityIcons
            color={colors.primary}
            name="alert"
            size={15}
          />
          <Text style={styles.warningText}>{budget.alert}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  statusCard: {
    overflow: "hidden",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.28)",
  },
  statusAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
    backgroundColor: colors.primary,
  },
  cardEyebrow: {
    color: colors.mutedText,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 2,
  },
  percent: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "900",
  },
  statusCopy: {
    maxWidth: 230,
    color: colors.mutedText,
    fontSize: fontSize.lg,
    fontWeight: "700",
    lineHeight: 23,
  },
  strong: {
    color: colors.text,
  },
  statusAmounts: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryAmount: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  secondaryAmount: {
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  progressTrack: {
    height: 12,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#2B2B2A",
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
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "900",
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
    backgroundColor: colors.primary,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  addButtonText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.text,
  },
  alertCard: {
    borderWidth: 1.5,
    borderColor: colors.primary,
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
    backgroundColor: "#2B2B2A",
  },
  alertIconBox: {
    backgroundColor: "#E63C3A26",
  },
  categoryCopy: {
    flex: 1,
  },
  categoryName: {
    color: colors.primaryText,
    fontSize: fontSize.lg,
    fontWeight: "900",
  },
  categoryType: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: "800",
  },
  categoryAction: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "900",
  },
  categoryActionLight: {
    color: colors.primaryText,
  },
  categoryAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  categorySpent: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  categoryRemaining: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "900",
  },
  categoryRemainingLight: {
    color: colors.primaryText,
  },
  warningPill: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#E63C3A26",
  },
  warningText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "900",
  },
});
