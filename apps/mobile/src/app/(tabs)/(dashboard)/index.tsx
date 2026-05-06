import { fontSize, spacing } from "@repo/theme";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceGraph } from "@/components/dashboard/balance-graph";
import { TransactionList } from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

export default function DashboardScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();

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
        <View style={styles.balanceRow}>
          <Text style={[styles.balance, { color: themeColors.text }]}>
            $ 13,553.00
          </Text>
          <Text style={[styles.balanceLabel, { color: themeColors.mutedText }]}>
            Balance
          </Text>
        </View>

        <BalanceGraph />
        <TransactionList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  balance: {
    fontSize: 34,
    fontWeight: "700",
  },
  balanceLabel: {
    paddingBottom: 7,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
