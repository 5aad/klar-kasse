import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import {
  TransactionList,
  type TransactionListItem,
} from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";

type FilterKey = "all" | "food" | "housing" | "travel" | "significant";

type SearchTransaction = TransactionListItem & {
  filter: Exclude<FilterKey, "all" | "significant">;
  group: "Today, Oct 24" | "Yesterday, Oct 23";
  value: number;
};

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "housing", label: "Housing" },
  { key: "travel", label: "Travel" },
  { key: "significant", label: "Significant Spending" },
];

const transactions: SearchTransaction[] = [
  {
    icon: "silverware-fork-knife",
    title: "Artisan Boulangerie",
    category: "Food & Dining",
    date: "10:45 AM",
    amount: "- $14.50",
    value: -14.5,
    filter: "food",
    group: "Today, Oct 24",
  },
  {
    icon: "home",
    title: "Skyline Management",
    category: "Housing",
    date: "08:00 AM",
    amount: "- $2,100.00",
    value: -2100,
    filter: "housing",
    group: "Today, Oct 24",
  },
  {
    icon: "cash-multiple",
    title: "Creative Studio Inc.",
    category: "Payroll",
    date: "Oct 23",
    amount: "+ $4,250.00",
    value: 4250,
    filter: "housing",
    group: "Yesterday, Oct 23",
  },
  {
    icon: "car",
    title: "Uber Technologies",
    category: "Travel",
    date: "Oct 23",
    amount: "- $23.40",
    value: -23.4,
    filter: "travel",
    group: "Yesterday, Oct 23",
  },
  {
    icon: "shopping",
    title: "Apple Store",
    category: "Shopping",
    date: "Oct 23",
    amount: "- $129.00",
    value: -129,
    filter: "food",
    group: "Yesterday, Oct 23",
  },
];

export default function SearchScreen() {
  const themeColors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "significant")
          return Math.abs(transaction.value) >= 100;

        return transaction.filter === activeFilter;
      }),
    [activeFilter],
  );

  const todayItems = filteredTransactions.filter(
    (transaction) => transaction.group === "Today, Oct 24",
  );
  const yesterdayItems = filteredTransactions.filter(
    (transaction) => transaction.group === "Yesterday, Oct 23",
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Search"
          subtitle="Find transactions by merchant, category, or amount."
        />

        <View style={[styles.panel, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.panelLabel, { color: themeColors.text }]}>
            SEARCH ACTIVITY
          </Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons
              color={themeColors.primary}
              name="magnify"
              size={22}
            />
            <TextInput
              placeholder="Merchant, category, or keyword..."
              placeholderTextColor={themeColors.mutedText}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.panelLabel, { color: themeColors.text }]}>
            CATEGORY FILTER
          </Text>
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <Pressable
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? themeColors.primary
                        : themeColors.background,
                    },
                  ]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: isActive
                          ? themeColors.primaryText
                          : themeColors.text,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {todayItems.length ? (
          <TransactionList
            actionLabel={null}
            items={todayItems}
            title="Today, Oct 24"
          />
        ) : null}

        {yesterdayItems.length ? (
          <TransactionList
            actionLabel={null}
            items={yesterdayItems}
            title="Yesterday, Oct 23"
          />
        ) : null}

        <Pressable
          style={[styles.olderButton, { backgroundColor: themeColors.surface }]}
        >
          <Text style={[styles.olderText, { color: themeColors.text }]}>
            Explore Older Records
          </Text>
          <MaterialCommunityIcons
            color={themeColors.text}
            name="chevron-down"
            size={18}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  panel: {
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  panelLabel: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  searchRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  olderButton: {
    minHeight: 52,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
  },
  olderText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
