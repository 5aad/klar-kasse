import { fontSize, radius, spacing } from "@repo/theme";
import { BarChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

const distributionData = [
  { label: "HOUSING", value: 1200 },
  { label: "DINING", value: 450 },
  { label: "TRAVEL", value: 280 },
  { label: "HEALTH", value: 95 },
  { label: "ENT.", value: 120 },
  { label: "MISC", value: 220 },
];

export function ExpenseDistributionChart() {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const chartWidth = Math.min(width - spacing.lg * 4, 320);
  const chartForeground =
    resolvedTheme === "dark" ? themeColors.background : themeColors.primaryText;
  const chartMuted =
    resolvedTheme === "dark" ? themeColors.background : themeColors.mutedText;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.text }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: chartForeground }]}>
            Expense Distribution
          </Text>
          <Text style={[styles.subtitle, { color: chartMuted }]}>
            Your spending patterns for this period
          </Text>
        </View>
        <View>
          <Text style={[styles.totalLabel, { color: chartMuted }]}>
            TOTAL SPENT
          </Text>
          <Text style={[styles.totalValue, { color: chartForeground }]}>
            $3,240.50
          </Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <BarChart
          barBorderRadius={5}
          barWidth={24}
          data={distributionData.map((item) => ({
            ...item,
            frontColor: item.value >= 450 ? chartForeground : chartMuted,
            labelTextStyle: [styles.labelText, { color: chartMuted }],
          }))}
          height={172}
          hideRules
          hideYAxisText
          initialSpacing={8}
          maxValue={1300}
          noOfSections={4}
          spacing={18}
          width={chartWidth}
          xAxisColor="transparent"
          yAxisColor="transparent"
        />
      </View>
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
  labelText: {
    fontSize: 7,
    fontWeight: "700",
  },
});
