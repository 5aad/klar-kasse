import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

export function getInitialMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

export function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

type Props = {
  selectedMonth: Date;
  onChange: (month: Date) => void;
};

export function MonthSelector({ onChange, selectedMonth }: Props) {
  const themeColors = useThemeColors();
  const { i18n } = useTranslation();
  const currentMonth = useMemo(getInitialMonth, []);
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth);
  const selectedMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "long",
        year: "numeric",
      }).format(selectedMonth),
    [i18n.language, selectedMonth],
  );

  return (
    <View
      style={[styles.monthSelector, { backgroundColor: themeColors.surface }]}
    >
      <Pressable
        style={styles.monthButton}
        onPress={() => onChange(shiftMonth(selectedMonth, -1))}
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
        onPress={() => onChange(shiftMonth(selectedMonth, 1))}
      >
        <MaterialCommunityIcons
          color={isCurrentMonth ? themeColors.mutedText : themeColors.text}
          name="chevron-right"
          size={20}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
