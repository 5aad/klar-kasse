import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";

export type TransactionListItem = {
  amount: string;
  category: string;
  date: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  id?: string;
  title: string;
};

const transactions: TransactionListItem[] = [
  {
    icon: "sack-outline",
    title: "AI-Bank",
    category: "Deposit",
    date: "Apr 29, 2026",
    amount: "+ $460.00",
  },
  {
    icon: "glass-wine",
    title: "Wine Shop",
    category: "Payment",
    date: "Apr 28, 2026",
    amount: "- $34.10",
  },
  {
    icon: "sack-outline",
    title: "Recipient",
    category: "Deposit",
    date: "Apr 27, 2026",
    amount: "+ $320.19",
  },
] as const;

type Props = {
  actionLabel?: string | null;
  items?: readonly TransactionListItem[];
  title?: string;
};

export function TransactionList({
  actionLabel = "View all",
  items = transactions,
  title = "Transaction List",
}: Props) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const iconBackground =
    resolvedTheme === "dark" ? themeColors.text : themeColors.text;
  const iconColor =
    resolvedTheme === "dark" ? themeColors.background : themeColors.primaryText;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        {actionLabel ? (
          <Pressable
            onPress={() => router.push("/(dashboard)/search")}
          >
            <Text style={[styles.viewAll, { color: themeColors.primary }]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {items.map((transaction) => (
          <View
            key={transaction.id ?? `${transaction.title}-${transaction.date}`}
            style={styles.row}
          >
            <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
              <MaterialCommunityIcons
                color={iconColor}
                name={transaction.icon}
                size={26}
              />
            </View>
            <View style={styles.copy}>
              <Text
                style={[styles.transactionTitle, { color: themeColors.text }]}
              >
                {transaction.title}
              </Text>
              <Text
                style={[
                  styles.transactionSubtitle,
                  { color: themeColors.mutedText },
                ]}
              >
                {transaction.category} | {transaction.date}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                {
                  color: transaction.amount.startsWith("-")
                    ? themeColors.mutedText
                    : themeColors.text,
                },
              ]}
            >
              {transaction.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  viewAll: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  transactionTitle: {
    fontSize: 22,
    fontWeight: "500",
  },
  transactionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  amount: {
    fontSize: 22,
    fontWeight: "500",
  },
});
