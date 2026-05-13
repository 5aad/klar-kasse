import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { NewCategoryModal } from "@/components/budget/new-category-modal";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/queries/categories";
import {
  useMonthlyBudgetQuery,
  useSaveMonthlyBudgetMutation,
} from "@/queries/budgets";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type CategoryBudget = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  id: string;
  name: string;
  type: string;
  spent: number;
  limit: number;
  alert?: string;
};

function isValidIcon(
  icon?: string | null,
): icon is keyof typeof MaterialCommunityIcons.glyphMap {
  return Boolean(icon && icon in MaterialCommunityIcons.glyphMap);
}

export default function BudgetScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const monthlyBudgetQuery = useMonthlyBudgetQuery();
  const saveMonthlyBudgetMutation = useSaveMonthlyBudgetMutation();
  const categoriesQuery = useCategoriesQuery();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const [isNewCategoryModalVisible, setIsNewCategoryModalVisible] =
    useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const budgetMonth = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
  }).format(new Date());
  const savedMonthlyBudget = monthlyBudgetQuery.data;
  const displayedMonthlyBudget = monthlyBudget;
  const totalBudget =
    Number(displayedMonthlyBudget.replace(/[^\d.]/g, "")) || 0;
  const totalSpent = savedMonthlyBudget?.spentAmount ?? 0;
  const totalLeft = Math.max(totalBudget - totalSpent, 0);
  const totalProgress =
    totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const totalPercent = Math.round(totalProgress * 100);
  const formattedBudget = totalBudget.toLocaleString();
  const categoryBudgets: CategoryBudget[] =
    categoriesQuery.data?.map((category) => ({
      id: category.id,
      icon: isValidIcon(category.icon) ? category.icon : "tag-outline",
      name: category.name,
      type: t("budget.category.typeCustom"),
      spent: category.spentAmount,
      limit: category.limitAmount,
    })) ?? [];

  useEffect(() => {
    if (savedMonthlyBudget) {
      setMonthlyBudget(String(savedMonthlyBudget.limitAmount || ""));
    } else if (monthlyBudgetQuery.isSuccess) {
      setMonthlyBudget("");
    }
  }, [monthlyBudgetQuery.isSuccess, savedMonthlyBudget]);

  const saveTotalBudget = () => {
    saveMonthlyBudgetMutation.mutate({
      limitAmount: totalBudget,
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 36) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isRefetching}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
            progressBackgroundColor={themeColors.surface}
            onRefresh={categoriesQuery.refetch}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("budget.title")}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
            {t("budget.subtitle")}
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
            {t("budget.status.eyebrow")}
          </Text>

          <View style={styles.budgetSetup}>
            <View style={styles.budgetField}>
              <Text style={[styles.budgetLabel, { color: themeColors.text }]}>
                {t("budget.status.month")}
              </Text>
              <View
                style={[
                  styles.monthValueContainer,
                  {
                    backgroundColor: themeColors.background,
                  },
                ]}
              >
                <Text style={[styles.monthValue, { color: themeColors.text }]}>
                  {budgetMonth}
                </Text>
              </View>
            </View>
            <View style={styles.budgetField}>
              <Text style={[styles.budgetLabel, { color: themeColors.text }]}>
                {t("budget.status.budget")}
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                value={displayedMonthlyBudget ? `$${displayedMonthlyBudget}` : ""}
                onChangeText={(value) =>
                  setMonthlyBudget(value.replace(/[^\d.]/g, ""))
                }
                onBlur={saveTotalBudget}
                placeholder={t("budget.status.budgetPlaceholder")}
                placeholderTextColor={themeColors.mutedText}
                style={[
                  styles.budgetInput,
                  {
                    borderColor: themeColors.text,
                    color: themeColors.text,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.percent, { color: themeColors.text }]}>
            {totalPercent}%
          </Text>
          <Text style={[styles.statusCopy, { color: themeColors.mutedText }]}>
            {t("budget.status.usedPrefix")}{" "}
            <Text style={[styles.strong, { color: themeColors.text }]}>
              ${formattedBudget}
            </Text>{" "}
            {t("budget.status.usedSuffix")}
          </Text>

          <View style={styles.statusAmounts}>
            <Text
              style={[styles.primaryAmount, { color: themeColors.primary }]}
            >
              {t("budget.status.spent", {
                amount: totalSpent.toLocaleString(),
              })}
            </Text>
            <Text
              style={[styles.secondaryAmount, { color: themeColors.mutedText }]}
            >
              {t("budget.status.left", {
                amount: totalLeft.toLocaleString(),
              })}
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
            {t("budget.category.title")}
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
              {t("budget.category.add")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {categoryBudgets.length ? (
            categoryBudgets.map((budget) => (
              <CategoryBudgetCard
                key={budget.id}
                budget={budget}
                onDelete={(id) => deleteCategoryMutation.mutate(id)}
              />
            ))
          ) : (
            <EmptyStateCard
              body={t("budget.category.emptyBody")}
              icon="tag-outline"
              title={t("budget.category.emptyTitle")}
            />
          )}
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

function CategoryBudgetCard({
  budget,
  onDelete,
}: {
  budget: CategoryBudget;
  onDelete?: (id: string) => void;
}) {
  const themeColors = useThemeColors();
  const { t } = useTranslation();
  const remaining = budget.limit - budget.spent;
  const progress = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const isAlert = Boolean(budget.alert);

  return (
    <View
      style={[
        styles.categoryCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.text,
          borderWidth: 1,
        },
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
          <Text style={[styles.categoryName, { color: themeColors.text }]}>
            {budget.name}
          </Text>
          <Text style={[styles.categoryType, { color: themeColors.text }]}>
            {budget.type}
          </Text>
        </View>
        <View style={styles.categoryActions}>
          <Pressable
            accessibilityLabel={t("budget.category.editAccessibility", {
              name: budget.name,
            })}
            accessibilityRole="button"
            style={[
              styles.categoryIconAction,
              { backgroundColor: themeColors.background },
            ]}
            onPress={() =>
              router.push({
                pathname: "/budget/edit-budget",
                params: {
                  id: budget.id,
                  icon: budget.icon,
                  limit: String(budget.limit),
                  name: budget.name,
                  spent: String(budget.spent),
                  type: budget.type,
                },
              })
            }
          >
            <MaterialCommunityIcons
              color={themeColors.text}
              name="pencil-outline"
              size={20}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={t("budget.category.deleteAccessibility", {
              name: budget.name,
            })}
            accessibilityRole="button"
            style={[
              styles.categoryIconAction,
              { backgroundColor: themeColors.background },
            ]}
            onPress={() => onDelete?.(budget.id)}
          >
            <MaterialCommunityIcons
              color={themeColors.primary}
              name="trash-can-outline"
              size={20}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.categoryAmounts}>
        <Text style={[styles.categorySpent, { color: themeColors.text }]}>
          {t("budget.category.spentOf", {
            limit: budget.limit.toLocaleString(),
            spent: budget.spent.toLocaleString(),
          })}
        </Text>
        <Text
          style={[
            styles.categoryRemaining,
            { color: isAlert ? themeColors.primary : themeColors.text },
          ]}
        >
          {t("budget.category.remaining", {
            amount: remaining.toLocaleString(),
          })}
        </Text>
      </View>
      <ProgressBar
        fillColor={isAlert ? themeColors.primary : themeColors.text}
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
  budgetSetup: {
    flexDirection: "row",
    gap: spacing.md,
  },
  budgetField: {
    flex: 1,
    gap: spacing.xs,
  },
  budgetLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1,
  },
  budgetInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  monthValueContainer: {
    minHeight: 46,
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  monthValue: {
    fontSize: fontSize.lg,
    fontWeight: "800",
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
  categoryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIconAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
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
