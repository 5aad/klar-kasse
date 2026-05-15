import { spacing } from "@repo/theme";
import { useEffect, useMemo, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

type SpendingPoint = {
  label: string;
  value: number;
};

type Props = {
  points: SpendingPoint[];
};

const axisLabels = ["1", "6", "11", "16", "21", "26", "31"];

function formatAxisAmount(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;

  return `${Math.round(value)}`;
}

function getLinePath(points: { x: number; y: number }[]) {
  if (!points.length) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function BalanceGraph({ points }: Props) {
  const { width } = useWindowDimensions();
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const { formatCurrency } = useCurrencyFormatter();
  const chartWidth = Math.min(width - spacing.lg * 4, 340);
  const chartHeight = 168;
  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const chartData = points.map((point) => ({ ...point }));
  const maxValue = Math.max(...chartData.map((point) => point.value), 1);
  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(chartData.length - 1, 0),
  );
  const chartForeground =
    resolvedTheme === "dark" ? themeColors.background : themeColors.primaryText;
  const chartMuted =
    resolvedTheme === "dark" ? themeColors.background : themeColors.mutedText;
  const chartPadding = {
    bottom: 20,
    left: 30,
    right: 4,
    top: 8,
  };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  useEffect(() => {
    setSelectedIndex(Math.max(chartData.length - 1, 0));
  }, [chartData.length]);

  const positionedPoints = useMemo(
    () =>
      chartData.map((point) => {
        const day = Number(point.label);
        const x =
          chartPadding.left +
          ((day - 1) / Math.max(daysInMonth - 1, 1)) * plotWidth;
        const y =
          chartPadding.top + plotHeight - (point.value / maxValue) * plotHeight;

        return { ...point, x, y };
      }),
    [
      chartData,
      chartPadding.left,
      chartPadding.top,
      daysInMonth,
      maxValue,
      plotHeight,
      plotWidth,
    ],
  );
  const activeIndex = Math.min(
    selectedIndex,
    Math.max(positionedPoints.length - 1, 0),
  );
  const activePoint = positionedPoints[activeIndex];
  const currentPoint = positionedPoints.at(-1);
  const activeLabelX = activePoint
    ? Math.min(Math.max(activePoint.x, 56), chartWidth - 56)
    : 0;
  const activeLabelY = activePoint ? Math.max(activePoint.y - 22, 8) : 0;
  const linePath = getLinePath(positionedPoints);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = event.nativeEvent.locationX;
          const day = Math.round(
            ((x - chartPadding.left) / Math.max(plotWidth, 1)) *
              Math.max(daysInMonth - 1, 1) +
              1,
          );
          const nextIndex = Math.max(
            0,
            Math.min(day - 1, positionedPoints.length - 1),
          );

          setSelectedIndex(nextIndex);
        },
        onPanResponderMove: (event) => {
          const x = event.nativeEvent.locationX;
          const day = Math.round(
            ((x - chartPadding.left) / Math.max(plotWidth, 1)) *
              Math.max(daysInMonth - 1, 1) +
              1,
          );
          const nextIndex = Math.max(
            0,
            Math.min(day - 1, positionedPoints.length - 1),
          );

          setSelectedIndex(nextIndex);
        },
      }),
    [chartPadding.left, daysInMonth, plotWidth, positionedPoints.length],
  );

  return (
    <View style={[styles.card, { backgroundColor: themeColors.text }]}>
      <View {...panResponder.panHandlers}>
        <Svg height={chartHeight} width={chartWidth}>
          {[0, 0.25, 0.5, 0.75, 1].map((section) => {
            const y = chartPadding.top + plotHeight * section;
            const axisValue = maxValue * (1 - section);

            return (
              <G key={`section-${section}`}>
                <SvgText
                  fill={chartMuted}
                  fontSize={10}
                  fontWeight="700"
                  textAnchor="end"
                  x={chartPadding.left - 8}
                  y={y + 3}
                >
                  {formatAxisAmount(axisValue)}
                </SvgText>
                <Line
                  opacity={0.28}
                  stroke={chartMuted}
                  strokeWidth={1}
                  x1={chartPadding.left}
                  x2={chartWidth - chartPadding.right}
                  y1={y}
                  y2={y}
                />
              </G>
            );
          })}
          <Path
            d={linePath}
            fill="none"
            stroke={chartForeground}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
          />
          {activePoint ? (
            <>
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                fill={themeColors.primary}
                r={6}
              />
              <Rect
                fill={themeColors.primary}
                height={18}
                rx={4}
                width={92}
                x={activeLabelX - 46}
                y={activeLabelY}
              />
              <SvgText
                fill={themeColors.primaryText}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
                x={activeLabelX}
                y={activeLabelY + 13}
              >
                {formatCurrency(activePoint.value)}
              </SvgText>
            </>
          ) : null}
          {currentPoint && currentPoint !== activePoint ? (
            <Circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              fill={themeColors.primary}
              r={4}
            />
          ) : null}
          {axisLabels.map((label) => {
            const day = Math.min(Number(label), daysInMonth);
            const x =
              chartPadding.left +
              ((day - 1) / Math.max(daysInMonth - 1, 1)) * plotWidth;

            return (
              <SvgText
                fill={chartMuted}
                fontSize={10}
                fontWeight="700"
                key={label}
                textAnchor="middle"
                x={x}
                y={chartHeight - 4}
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 28,
    padding: spacing.lg,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.28)",
  },
});
