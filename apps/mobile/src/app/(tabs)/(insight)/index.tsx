import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ExpenseDistributionChart } from "@/components/insight/expense-distribution-chart";
import { TransactionList } from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type ThemeColors = ReturnType<typeof useThemeColors>;

const categoryBreakdown = [
  { name: "Dining", amount: "$450.00", percent: "35%", progress: 0.75 },
  { name: "Housing", amount: "$1,200.00", percent: "45%", progress: 0.55 },
  { name: "Travel", amount: "$280.00", percent: "15%", progress: 0.28 },
  { name: "Entertainment", amount: "$120.00", percent: "5%", progress: 0.18 },
];

const significantSpending = [
  {
    icon: "silverware-fork-knife",
    title: "Blue Ginger Bistro",
    category: "Dining",
    date: "Oct 14",
    amount: "-$84.20",
  },
  {
    icon: "airplane",
    title: "Skyways Airline",
    category: "Travel",
    date: "Oct 08",
    amount: "-$250.00",
  },
  {
    icon: "shopping",
    title: "Modern Threads",
    category: "Clothing",
    date: "Oct 02",
    amount: "-$112.50",
  },
  {
    icon: "movie-open",
    title: "CineVerse Plex",
    category: "Ent.",
    date: "Oct 21",
    amount: "-$24.00",
  },
] as const;

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

export default function InsightScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const currentMonth = useMemo(getInitialMonth, []);
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth);
  const selectedMonthLabel = useMemo(
    () =>
      `${monthNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`,
    [selectedMonth],
  );

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
        <CategoryBreakdown themeColors={themeColors} />
        <TransactionList
          actionLabel="View all"
          items={significantSpending}
          title="Significant Spending"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBreakdown({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <View
      style={[styles.breakdownCard, { backgroundColor: themeColors.surface }]}
    >
      <Text style={[styles.breakdownTitle, { color: themeColors.text }]}>
        Category Breakdown
      </Text>
      <View style={styles.breakdownList}>
        {categoryBreakdown.map((category) => (
          <View key={category.name} style={styles.breakdownRow}>
            <View style={styles.breakdownTop}>
              <View style={styles.categoryNameWrap}>
                <View
                  style={[styles.dot, { backgroundColor: themeColors.primary }]}
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
        ))}
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
