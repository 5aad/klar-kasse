import { colors, fontSize, radius, spacing } from "@repo/theme";
import { LineChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

const balanceData = [
  { value: 42 },
  { value: 32 },
  { value: 18 },
  { value: 86 },
  { value: 158 },
  { value: 78 },
  { value: 184 },
  { value: 128 },
  { value: 214 },
  { value: 176 },
  { value: 158, dataPointText: "$409" },
  { value: 132 },
  { value: 92 },
];

const ranges = ["1D", "5D", "1M", "3M", "6M", "1Y"];

export function BalanceGraph() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - spacing.lg * 4, 340);

  return (
    <View style={styles.card}>
      <LineChart
        areaChart={false}
        curved
        color={colors.primaryText}
        data={balanceData}
        dataPointsColor={colors.primary}
        dataPointsRadius={0}
        endSpacing={8}
        height={168}
        hideOrigin
        hideRules={false}
        hideYAxisText={false}
        initialSpacing={6}
        maxValue={240}
        noOfSections={4}
        pointerConfig={{
          pointerStripColor: "transparent",
          pointerColor: colors.primary,
          radius: 6,
          pointerLabelComponent: () => (
            <View style={styles.pointerLabel}>
              <Text style={styles.pointerLabelText}>$409</Text>
            </View>
          ),
        }}
        rulesColor="#252525"
        rulesType="solid"
        spacing={chartWidth / balanceData.length}
        thickness={4}
        width={chartWidth}
        xAxisColor="transparent"
        yAxisColor="transparent"
        yAxisTextStyle={styles.axisText}
      />

      <View style={styles.rangeRow}>
        {ranges.map((range) => (
          <View
            key={range}
            style={[styles.rangeItem, range === "5D" && styles.rangeSelected]}
          >
            <Text
              style={[
                styles.rangeText,
                range === "5D" && styles.rangeSelectedText,
              ]}
            >
              {range}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: colors.text,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.28)",
  },
  axisText: {
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  pointerLabel: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.primary,
  },
  pointerLabelText: {
    color: colors.primaryText,
    fontSize: fontSize.xs,
    fontWeight: "900",
  },
  rangeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  rangeItem: {
    minWidth: 42,
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rangeSelected: {
    backgroundColor: colors.mutedText,
  },
  rangeText: {
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "900",
  },
  rangeSelectedText: {
    color: colors.primaryText,
  },
});
