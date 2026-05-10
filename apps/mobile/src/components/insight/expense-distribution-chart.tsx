import { fontSize, radius, spacing } from "@repo/theme";
import { BarChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

type ExpenseDistributionItem = {
  label: string;
  value: number;
};

type Props = {
  data: ExpenseDistributionItem[];
  periodLabel: string;
};

function formatTotal(value: number) {
  return `EUR ${value.toFixed(2)}`;
}

function formatChartLabel(label: string) {
  const words = label
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 4)
      .toUpperCase();
  }

  return label.slice(0, 5).toUpperCase();
}

export function ExpenseDistributionChart({ data, periodLabel }: Props) {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const chartWidth = Math.min(width - spacing.lg * 4, 320);
  const spendingData = data
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
  const chartData = spendingData.slice(0, 6);
  const totalSpent = spendingData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const chartForeground =
    resolvedTheme === "dark" ? themeColors.background : themeColors.primaryText;
  const chartMuted =
    resolvedTheme === "dark" ? themeColors.background : themeColors.mutedText;
  const highlightValue = Math.max(...chartData.map((item) => item.value), 0);

  return (
    <View style={[styles.card, { backgroundColor: themeColors.text }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: chartForeground }]}>
            Expense Distribution
          </Text>
          <Text style={[styles.subtitle, { color: chartMuted }]}>
            Your spending patterns for {periodLabel}
          </Text>
        </View>
        <View>
          <Text style={[styles.totalLabel, { color: chartMuted }]}>
            TOTAL SPENT
          </Text>
          <Text style={[styles.totalValue, { color: chartForeground }]}>
            {formatTotal(totalSpent)}
          </Text>
        </View>
      </View>

      {chartData.length ? (
        <View style={styles.chartWrap}>
          <BarChart
            barBorderRadius={5}
            barWidth={24}
            data={chartData.map((item) => ({
              label: formatChartLabel(item.label),
              value: item.value,
              frontColor:
                item.value === highlightValue ? chartForeground : chartMuted,
              labelTextStyle: [styles.labelText, { color: chartMuted }],
            }))}
            height={172}
            hideRules
            hideYAxisText
            initialSpacing={8}
            maxValue={maxValue * 1.15}
            noOfSections={4}
            spacing={18}
            width={chartWidth}
            xAxisColor="transparent"
            yAxisColor="transparent"
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyTitle, { color: chartForeground }]}>
            No spending yet
          </Text>
          <Text style={[styles.emptyBody, { color: chartMuted }]}>
            Scan receipts to build this month's distribution.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.28)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: spacing.xs,
    maxWidth: 130,
    fontSize: fontSize.sm,
    fontWeight: "500",
    lineHeight: 16,
  },
  totalLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  chartWrap: {
    overflow: "hidden",
  },
  emptyChart: {
    minHeight: 172,
    justifyContent: "center",
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  emptyBody: {
    maxWidth: 220,
    fontSize: fontSize.sm,
    fontWeight: "600",
    lineHeight: 18,
  },
  labelText: {
    fontSize: 7,
    fontWeight: "700",
  },
});
