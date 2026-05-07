import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ExpenseDistributionChart } from "@/components/insight/expense-distribution-chart";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { TransactionList } from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useCategoriesQuery } from "@/queries/categories";
import { useReceiptsQuery } from "@/queries/receipts";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type ThemeColors = ReturnType<typeof useThemeColors>;
type CategoryBreakdownItem = {
  amount: string;
  name: string;
  percent: string;
  progress: number;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function getInitialMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function formatReceiptItemAmount(amount: number) {
  return `- EUR ${amount.toFixed(2)}`;
}

function formatCategoryAmount(amount: number) {
  return `EUR ${amount.toFixed(2)}`;
}

function isReceiptInMonth(dateText: string | null, selectedMonth: Date) {
  if (!dateText) return true;

  const parsedDate = parseReceiptDate(dateText);

  if (!parsedDate) return true;

  return isSameMonth(parsedDate, selectedMonth);
}

function parseReceiptDate(dateText: string) {
  const match = dateText.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);

  if (!match) return null;

  const year =
    match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);

  return new Date(year, Number(match[2]) - 1, Number(match[1]));
}

export default function InsightScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const categoriesQuery = useCategoriesQuery();
  const receiptsQuery = useReceiptsQuery();
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const currentMonth = useMemo(getInitialMonth, []);
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth);
  const selectedMonthLabel = useMemo(
    () =>
      `${monthNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`,
    [selectedMonth],
  );
  const significantSpending = useMemo(
    () =>
      receiptsQuery.data
        ?.flatMap((receipt) =>
          receipt.items.map((item) => ({
            id: item.id,
            icon: "receipt-text-outline" as const,
            title: item.name,
            category: receipt.categoryName ?? receipt.store,
            date: receipt.dateText ?? receipt.createdAt,
            amount: formatReceiptItemAmount(item.price),
            value: item.price,
          })),
        )
        .sort((left, right) => right.value - left.value)
        .slice(0, 5) ?? [],
    [receiptsQuery.data],
  );
  const categoryBreakdown = useMemo<CategoryBreakdownItem[]>(() => {
    const totals = new Map<string, number>();

    for (const category of categoriesQuery.data ?? []) {
      totals.set(category.name, 0);
    }

    for (const receipt of receiptsQuery.data ?? []) {
      if (!isReceiptInMonth(receipt.dateText, selectedMonth)) continue;

      const categoryName = receipt.categoryName ?? "Receipt";

      totals.set(categoryName, (totals.get(categoryName) ?? 0) + receipt.total);
    }

    const totalSpent = [...totals.values()].reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return [...totals.entries()]
      .map(([name, amount]) => {
        const progress = totalSpent > 0 ? amount / totalSpent : 0;

        return {
          name,
          amount: formatCategoryAmount(amount),
          percent: `${Math.round(progress * 100)}%`,
          progress,
        };
      })
      .sort((left, right) => right.progress - left.progress)
      .slice(0, 5);
  }, [categoriesQuery.data, receiptsQuery.data, selectedMonth]);
  const refreshInsights = () => {
    categoriesQuery.refetch();
    receiptsQuery.refetch();
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
            refreshing={categoriesQuery.isRefetching || receiptsQuery.isRefetching}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
            progressBackgroundColor={themeColors.surface}
            onRefresh={refreshInsights}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
            MONTHLY OVERVIEW
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Spending Insights
          </Text>
        </View>

        <View
          style={[
            styles.monthSelector,
            { backgroundColor: themeColors.surface },
          ]}
        >
          <Pressable
            style={styles.monthButton}
            onPress={() => setSelectedMonth((month) => shiftMonth(month, -1))}
          >
            <MaterialCommunityIcons
              color={themeColors.text}
              name="chevron-left"
              size={20}
            />
          </Pressable>
          <Text style={[styles.monthText, { color: themeColors.text }]}>
            {selectedMonthLabel}
          </Text>
          <Pressable
            disabled={isCurrentMonth}
            style={[styles.monthButton, isCurrentMonth && styles.disabledMonthButton]}
            onPress={() => setSelectedMonth((month) => shiftMonth(month, 1))}
          >
            <MaterialCommunityIcons
              color={isCurrentMonth ? themeColors.mutedText : themeColors.text}
              name="chevron-right"
              size={20}
            />
          </Pressable>
        </View>

        <ExpenseDistributionChart />
        <CategoryBreakdown
          categories={categoryBreakdown}
          themeColors={themeColors}
        />
        <TransactionList
          actionLabel="View all"
          items={significantSpending}
          title="Significant Spending"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBreakdown({
  categories,
  themeColors,
}: {
  categories: CategoryBreakdownItem[];
  themeColors: ThemeColors;
}) {
  return (
    <View
      style={[styles.breakdownCard, { backgroundColor: themeColors.surface }]}
    >
      <Text style={[styles.breakdownTitle, { color: themeColors.text }]}>
        Category Breakdown
      </Text>
      <View style={styles.breakdownList}>
        {categories.length ? (
          categories.map((category) => (
            <View key={category.name} style={styles.breakdownRow}>
              <View style={styles.breakdownTop}>
                <View style={styles.categoryNameWrap}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: themeColors.primary },
                    ]}
                  />
                  <Text
                    style={[styles.categoryName, { color: themeColors.text }]}
                  >
                    {category.name}
                  </Text>
                </View>
                <Text
                  style={[styles.categoryAmount, { color: themeColors.text }]}
                >
                  {category.amount}
                </Text>
              </View>
              <View style={styles.breakdownBottom}>
                <View
                  style={[
                    styles.breakdownTrack,
                    { backgroundColor: themeColors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.breakdownFill,
                      {
                        backgroundColor: themeColors.primary,
                        width: `${category.progress * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryPercent,
                    { color: themeColors.mutedText },
                  ]}
                >
                  {category.percent}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyStateCard
            body="Scan receipts to see where your spending goes."
            icon="chart-donut"
            title="No category spending yet"
          />
        )}
      </View>
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
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  monthSelector: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  monthButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledMonthButton: {
    opacity: 0.45,
  },
  monthText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  breakdownCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  breakdownTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  breakdownList: {
    gap: spacing.md,
  },
  breakdownRow: {
    gap: spacing.xs,
  },
  breakdownTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  categoryNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  categoryAmount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  breakdownBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  breakdownTrack: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 999,
  },
  categoryPercent: {
    width: 34,
    fontSize: fontSize.xs,
    fontWeight: "600",
    textAlign: "right",
  },
});
