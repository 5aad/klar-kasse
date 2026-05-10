import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceGraph } from "@/components/dashboard/balance-graph";
import { TransactionList } from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useMonthlyBudgetQuery } from "@/queries/budgets";
import { useReceiptsQuery } from "@/queries/receipts";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

const categoryIcons = {
  "Food & Drinks": "silverware-fork-knife",
  Groceries: "cart",
  Housing: "home",
  Shopping: "shopping",
  Travel: "airplane",
} as const;

function formatReceiptAmount(total: number) {
  return `- EUR ${total.toFixed(2)}`;
}

function getReceiptIcon(category?: string | null) {
  return (
    categoryIcons[category as keyof typeof categoryIcons] ??
    "receipt-text-outline"
  );
}

function parseReceiptDate(dateText?: string | null) {
  if (!dateText) return null;

  const germanDate = dateText.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (germanDate) {
    const year =
      germanDate[3].length === 2
        ? Number(`20${germanDate[3]}`)
        : Number(germanDate[3]);

    return new Date(year, Number(germanDate[2]) - 1, Number(germanDate[1]));
  }

  const date = new Date(dateText);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isCurrentMonth(date: Date) {
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

function getCurrentMonthSpendingPoints(
  receipts: NonNullable<ReturnType<typeof useReceiptsQuery>["data"]>,
) {
  const today = new Date();
  const spendingByDay = new Map<number, number>();

  for (const receipt of receipts) {
    const receiptDate =
      parseReceiptDate(receipt.dateText) ?? parseReceiptDate(receipt.createdAt);

    if (!receiptDate || !isCurrentMonth(receiptDate)) continue;

    const day = receiptDate.getDate();

    spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + receipt.total);
  }

  let cumulativeSpent = 0;

  return Array.from({ length: today.getDate() }, (_, index) => {
    const day = index + 1;

    cumulativeSpent += spendingByDay.get(day) ?? 0;

    return {
      label: String(day),
      value: cumulativeSpent,
    };
  });
}

export default function DashboardScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const monthlyBudgetQuery = useMonthlyBudgetQuery();
  const receiptsQuery = useReceiptsQuery();
  const monthlyBudget = monthlyBudgetQuery.data;
  const remainingBudget = Math.max(
    (monthlyBudget?.limitAmount ?? 0) - (monthlyBudget?.spentAmount ?? 0),
    0,
  );
  const spendingPoints = useMemo(
    () => getCurrentMonthSpendingPoints(receiptsQuery.data ?? []),
    [receiptsQuery.data],
  );
  const receiptTransactions =
    receiptsQuery.data
      ?.slice(0, 5)
      .map((receipt) => ({
        id: receipt.id,
        icon: getReceiptIcon(receipt.categoryName),
        title: receipt.store,
        category: receipt.categoryName ?? "Receipt",
        date: receipt.dateText ?? receipt.createdAt,
        amount: formatReceiptAmount(receipt.total),
      })) ?? [];

  const refreshDashboard = () => {
    monthlyBudgetQuery.refetch();
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
            refreshing={
              monthlyBudgetQuery.isRefetching || receiptsQuery.isRefetching
            }
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
            progressBackgroundColor={themeColors.surface}
            onRefresh={refreshDashboard}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.balanceRow}>
            <Text style={[styles.balance, { color: themeColors.text }]}>
              EUR{" "}
              {remainingBudget.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
            <Text
              style={[styles.balanceLabel, { color: themeColors.mutedText }]}
            >
              Remaining Budget
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Search transactions"
            accessibilityRole="button"
            style={[
              styles.searchButton,
              { backgroundColor: themeColors.surface },
            ]}
            onPress={() => router.push("/(dashboard)/search")}
          >
            <MaterialCommunityIcons
              color={themeColors.text}
              name="magnify"
              size={25}
            />
          </Pressable>
        </View>

        <BalanceGraph points={spendingPoints} />
        <TransactionList items={receiptTransactions} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    flex: 1,
  },
  balance: {
    fontSize: 34,
    fontWeight: "700",
  },
  balanceLabel: {
    paddingBottom: 7,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
});
