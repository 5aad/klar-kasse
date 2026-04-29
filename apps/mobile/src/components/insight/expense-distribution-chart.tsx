import { colors, fontSize, radius, spacing } from "@repo/theme";
import { BarChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

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
  const chartWidth = Math.min(width - spacing.lg * 4, 320);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Expense Distribution</Text>
          <Text style={styles.subtitle}>
            Your spending patterns for this period
          </Text>
        </View>
        <View>
          <Text style={styles.totalLabel}>TOTAL SPENT</Text>
          <Text style={styles.totalValue}>$3,240.50</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <BarChart
          barBorderRadius={5}
          barWidth={24}
          data={distributionData.map((item) => ({
            ...item,
            frontColor:
              item.value >= 450 ? colors.primaryText : colors.mutedText,
            labelTextStyle: styles.labelText,
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
    backgroundColor: colors.text,
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
    color: colors.primaryText,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: spacing.xs,
    maxWidth: 130,
    color: colors.mutedText,
    fontSize: fontSize.sm,
    fontWeight: "500",
    lineHeight: 16,
  },
  totalLabel: {
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalValue: {
    color: colors.primaryText,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  chartWrap: {
    overflow: "hidden",
  },
  labelText: {
    color: colors.mutedText,
    fontSize: 7,
    fontWeight: "700",
  },
});
