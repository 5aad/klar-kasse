import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceGraph } from "@/components/dashboard/balance-graph";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";
import {
  getInitialMonth,
  isSameMonth,
  MonthSelector,
} from "@/components/shared/month-selector";
import { TransactionList } from "@/components/shared/transaction-list";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
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

function getCurrentMonthSpendingPoints(
  receipts: NonNullable<ReturnType<typeof useReceiptsQuery>["data"]>,
  selectedMonth: Date,
) {
  const today = new Date();
  const isSelectedCurrentMonth = isSameMonth(selectedMonth, today);
  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
  ).getDate();
  const pointCount = isSelectedCurrentMonth ? today.getDate() : daysInMonth;
  const spendingByDay = new Map<number, number>();

  for (const receipt of receipts) {
    const receiptDate =
      parseReceiptDate(receipt.dateText) ?? parseReceiptDate(receipt.createdAt);

    if (!receiptDate || !isSameMonth(receiptDate, selectedMonth)) continue;

    const day = receiptDate.getDate();

    spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + receipt.total);
  }

  let cumulativeSpent = 0;

  return Array.from({ length: pointCount }, (_, index) => {
    const day = index + 1;

    cumulativeSpent += spendingByDay.get(day) ?? 0;

    return {
      label: String(day),
      value: cumulativeSpent,
    };
  });
}

function isReceiptInMonth(
  receipt: NonNullable<ReturnType<typeof useReceiptsQuery>["data"]>[number],
  selectedMonth: Date,
) {
  const receiptDate =
    parseReceiptDate(receipt.dateText) ?? parseReceiptDate(receipt.createdAt);

  return receiptDate ? isSameMonth(receiptDate, selectedMonth) : false;
}

export default function DashboardScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormatter();
  const monthlyBudgetQuery = useMonthlyBudgetQuery();
  const receiptsQuery = useReceiptsQuery();
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const monthlyBudget = monthlyBudgetQuery.data;
  const remainingBudget =
    (monthlyBudget?.limitAmount ?? 0) - (monthlyBudget?.spentAmount ?? 0);
  const spendingPoints = useMemo(
    () => getCurrentMonthSpendingPoints(receiptsQuery.data ?? [], selectedMonth),
    [receiptsQuery.data, selectedMonth],
  );
  const receiptTransactions = useMemo(
    () =>
      receiptsQuery.data
        ?.filter((receipt) => isReceiptInMonth(receipt, selectedMonth))
        .slice(0, 5)
        .map((receipt) => ({
        id: receipt.id,
        icon: getReceiptIcon(receipt.categoryName),
        title: receipt.store,
        category: receipt.categoryName ?? t("dashboard.receiptFallback"),
        date: receipt.dateText ?? receipt.createdAt,
        amount: formatCurrency(receipt.total),
        })) ?? [],
    [formatCurrency, receiptsQuery.data, selectedMonth, t],
  );

  const refreshDashboard = () => {
    monthlyBudgetQuery.refetch();
    receiptsQuery.refetch();
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAwareScrollView
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
              {formatCurrency(remainingBudget, {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              })}
            </Text>
            <Text
              style={[styles.balanceLabel, { color: themeColors.mutedText }]}
            >
              {t("dashboard.remainingBudget")}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t("dashboard.searchTransactions")}
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

        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={setSelectedMonth}
        />
        <BalanceGraph points={spendingPoints} />
        <TransactionList items={receiptTransactions} />
      </KeyboardAwareScrollView>
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
