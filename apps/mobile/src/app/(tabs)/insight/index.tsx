import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpenseDistributionChart } from "@/components/insight/expense-distribution-chart";
import { TransactionList } from "@/components/shared/transaction-list";

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

export default function InsightScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MONTHLY OVERVIEW</Text>
          <Text style={styles.title}>Spending Insights</Text>
        </View>

        <View style={styles.monthSelector}>
          <Pressable style={styles.monthButton}>
            <MaterialCommunityIcons
              color={colors.text}
              name="chevron-left"
              size={20}
            />
          </Pressable>
          <Text style={styles.monthText}>October 2023</Text>
          <Pressable style={styles.monthButton}>
            <MaterialCommunityIcons
              color={colors.text}
              name="chevron-right"
              size={20}
            />
          </Pressable>
        </View>

        <ExpenseDistributionChart />
        <CategoryBreakdown />
        <TransactionList
          actionLabel="View all"
          items={significantSpending}
          title="Significant Spending"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBreakdown() {
  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>Category Breakdown</Text>
      <View style={styles.breakdownList}>
        {categoryBreakdown.map((category) => (
          <View key={category.name} style={styles.breakdownRow}>
            <View style={styles.breakdownTop}>
              <View style={styles.categoryNameWrap}>
                <View style={styles.dot} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
              <Text style={styles.categoryAmount}>{category.amount}</Text>
            </View>
            <View style={styles.breakdownBottom}>
              <View style={styles.breakdownTrack}>
                <View
                  style={[
                    styles.breakdownFill,
                    { width: `${category.progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.categoryPercent}>{category.percent}</Text>
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
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
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
    backgroundColor: colors.surface,
  },
  monthButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  breakdownCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  breakdownTitle: {
    color: colors.text,
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
    backgroundColor: colors.primary,
  },
  categoryName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  categoryAmount: {
    color: colors.text,
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
    backgroundColor: colors.background,
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  categoryPercent: {
    width: 34,
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "600",
    textAlign: "right",
  },
});
