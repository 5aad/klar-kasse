import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { StyleSheet, Text, View } from "react-native";

type Transaction = {
  amount: string;
  category: string;
  date: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
};

const transactions: Transaction[] = [
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
  actionLabel?: string;
  items?: readonly Transaction[];
  title?: string;
};

export function TransactionList({
  actionLabel = "View all",
  items = transactions,
  title = "Transaction List",
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.viewAll}>{actionLabel}</Text>
      </View>

      <View style={styles.list}>
        {items.map((transaction) => (
          <View key={transaction.title} style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                color={colors.primaryText}
                name={transaction.icon}
                size={26}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionSubtitle}>
                {transaction.category} | {transaction.date}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                transaction.amount.startsWith("-") && styles.negativeAmount,
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
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  viewAll: {
    color: colors.primary,
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
    backgroundColor: colors.text,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  transactionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "500",
  },
  transactionSubtitle: {
    color: colors.mutedText,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  amount: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "500",
  },
  negativeAmount: {
    color: colors.mutedText,
  },
});
