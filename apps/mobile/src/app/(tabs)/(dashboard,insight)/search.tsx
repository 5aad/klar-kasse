import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";
import {
  getInitialMonth,
  MonthSelector,
} from "@/components/shared/month-selector";
import { ScreenHeader } from "@/components/shared/screen-header";
import {
  TransactionList,
  type TransactionListItem,
} from "@/components/shared/transaction-list";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useCategoriesQuery } from "@/queries/categories";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type FilterKey = "all" | "significant" | `category:${string}`;

type SearchTransaction = TransactionListItem & {
  categoryKey: string;
  group: "today" | "yesterday";
  groupKey: string;
  value: number;
};

type SearchFilter = {
  categoryName?: string;
  key: FilterKey;
  label: string;
};

const transactions: SearchTransaction[] = [
  {
    icon: "silverware-fork-knife",
    title: "Artisan Boulangerie",
    category: "",
    categoryKey: "dashboard.search.categories.foodDining",
    date: "10:45 AM",
    amount: "- $14.50",
    value: -14.5,
    group: "today",
    groupKey: "dashboard.search.groups.today",
  },
  {
    icon: "home",
    title: "Skyline Management",
    category: "",
    categoryKey: "dashboard.search.categories.housing",
    date: "08:00 AM",
    amount: "- $2,100.00",
    value: -2100,
    group: "today",
    groupKey: "dashboard.search.groups.today",
  },
  {
    icon: "cash-multiple",
    title: "Creative Studio Inc.",
    category: "",
    categoryKey: "dashboard.search.categories.payroll",
    date: "Oct 23",
    amount: "+ $4,250.00",
    value: 4250,
    group: "yesterday",
    groupKey: "dashboard.search.groups.yesterday",
  },
  {
    icon: "car",
    title: "Uber Technologies",
    category: "",
    categoryKey: "dashboard.search.categories.travel",
    date: "Oct 23",
    amount: "- $23.40",
    value: -23.4,
    group: "yesterday",
    groupKey: "dashboard.search.groups.yesterday",
  },
  {
    icon: "shopping",
    title: "Apple Store",
    category: "",
    categoryKey: "dashboard.search.categories.shopping",
    date: "Oct 23",
    amount: "- $129.00",
    value: -129,
    group: "yesterday",
    groupKey: "dashboard.search.groups.yesterday",
  },
];

export default function SearchScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const categoriesQuery = useCategoriesQuery();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const filters = useMemo<SearchFilter[]>(
    () => [
      { key: "all", label: t("dashboard.search.filters.all") },
      ...(categoriesQuery.data?.map((category) => ({
        categoryName: category.name,
        key: `category:${category.id}` as const,
        label: category.name,
      })) ?? []),
      {
        key: "significant",
        label: t("dashboard.search.filters.significant"),
      },
    ],
    [categoriesQuery.data, t],
  );
  const activeCategoryName = filters.find(
    (filter) => filter.key === activeFilter,
  )?.categoryName;

  const filteredTransactions = useMemo(
    () => {
      const translatedCategories = transactions.map((transaction) => ({
        ...transaction,
        category: t(transaction.categoryKey),
      }));

      return translatedCategories.filter((transaction) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "significant")
          return Math.abs(transaction.value) >= 100;

        return activeCategoryName
          ? transaction.category === activeCategoryName
          : true;
      });
    },
    [activeCategoryName, activeFilter, t],
  );

  const todayItems = filteredTransactions.filter(
    (transaction) => transaction.group === "today",
  );
  const yesterdayItems = filteredTransactions.filter(
    (transaction) => transaction.group === "yesterday",
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("dashboard.search.title")}
          subtitle={t("dashboard.search.subtitle")}
        />

        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={setSelectedMonth}
        />

        <View style={[styles.panel, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.panelLabel, { color: themeColors.text }]}>
            {t("dashboard.search.activity")}
          </Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons
              color={themeColors.primary}
              name="magnify"
              size={22}
            />
            <TextInput
              placeholder={t("dashboard.search.placeholder")}
              placeholderTextColor={themeColors.mutedText}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.panelLabel, { color: themeColors.text }]}>
            {t("dashboard.search.categoryFilter")}
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
            title={t("dashboard.search.groups.today")}
          />
        ) : null}

        {yesterdayItems.length ? (
          <TransactionList
            actionLabel={null}
            items={yesterdayItems}
            title={t("dashboard.search.groups.yesterday")}
          />
        ) : null}

        <Pressable
          style={[styles.olderButton, { backgroundColor: themeColors.surface }]}
        >
          <Text style={[styles.olderText, { color: themeColors.text }]}>
            {t("dashboard.search.exploreOlder")}
          </Text>
          <MaterialCommunityIcons
            color={themeColors.text}
            name="chevron-down"
            size={18}
          />
        </Pressable>
      </KeyboardAwareScrollView>
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
