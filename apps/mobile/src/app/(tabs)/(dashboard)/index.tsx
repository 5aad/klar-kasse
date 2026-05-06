import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
        <View style={styles.header}>
          <View style={styles.balanceRow}>
            <Text style={[styles.balance, { color: themeColors.text }]}>
              $ 13,553.00
            </Text>
            <Text
              style={[styles.balanceLabel, { color: themeColors.mutedText }]}
            >
              Balance
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Search transactions"
            accessibilityRole="button"
            style={[
              styles.searchButton,
              { backgroundColor: themeColors.surface },
            ]}
            onPress={() => router.push("/(dashboard)/search")}
          >
            <MaterialCommunityIcons
              color={themeColors.text}
              name="magnify"
              size={25}
            />
          </Pressable>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    flex: 1,
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
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
});
