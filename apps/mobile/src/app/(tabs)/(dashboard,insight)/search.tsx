import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useCategoriesQuery } from "@/queries/categories";
import { useReceiptsQuery } from "@/queries/receipts";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type FilterKey = "all" | "significant" | `category:${string}`;

type SearchFilter = {
  categoryName?: string;
  key: FilterKey;
  label: string;
};

const PAGE_SIZE = 12;

const categoryIcons = {
  "Food & Drinks": "silverware-fork-knife",
  Groceries: "cart",
  Housing: "home",
  Shopping: "shopping",
  Travel: "airplane",
} as const;

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositivePage(value: string | string[] | undefined) {
  const page = Number(getParamValue(value));

  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getFilterKey(value: string | string[] | undefined): FilterKey {
  const filter = getParamValue(value);

  if (!filter || filter === "all") return "all";
  if (filter === "significant") return "significant";

  return `category:${filter}`;
}

function getFilterParam(filter: FilterKey) {
  if (filter === "all" || filter === "significant") return filter;

  return filter.replace("category:", "");
}

function parseReceiptDate(dateText?: string | null) {
  if (!dateText) return null;

  const germanDate = dateText.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (germanDate) {
    const year =
      germanDate[3].length === 2
        ? Number(`20${germanDate[3]}`)
        : Number(germanDate[3]);

    return new Date(year, Number(germanDate[2]) - 1, Number(germanDate[1]));
  }

  const date = new Date(dateText);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getReceiptIcon(category?: string | null) {
  return (
    categoryIcons[category as keyof typeof categoryIcons] ??
    "receipt-text-outline"
  );
}

export default function SearchScreen() {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { bottom } = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const { formatCurrency } = useCurrencyFormatter();
  const params = useLocalSearchParams<{
    category?: string;
    page?: string;
    q?: string;
  }>();
  const categoriesQuery = useCategoriesQuery();
  const receiptsQuery = useReceiptsQuery();
  const searchQuery = getParamValue(params.q) ?? "";
  const activeFilter = getFilterKey(params.category);
  const currentPage = parsePositivePage(params.page);
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const activeCategoryId =
    activeFilter === "all" || activeFilter === "significant"
      ? null
      : activeFilter.replace("category:", "");
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
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [i18n.language],
  );

  const filteredReceipts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchingReceipts = (receiptsQuery.data ?? []).filter((receipt) => {
      const receiptDate =
        parseReceiptDate(receipt.dateText) ??
        parseReceiptDate(receipt.createdAt);

      if (receiptDate && !isSameMonth(receiptDate, selectedMonth)) return false;
      if (
        activeFilter !== "all" &&
        activeFilter !== "significant" &&
        activeCategoryId &&
        receipt.categoryId !== activeCategoryId &&
        receipt.categoryName !== activeCategoryName
      ) {
        return false;
      }
      if (!normalizedQuery) return true;

      const searchableText = [
        receipt.store,
        receipt.categoryName,
        receipt.note,
        receipt.total.toFixed(2),
        ...receipt.items.map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });

    if (activeFilter !== "significant") return matchingReceipts;

    return [...matchingReceipts].sort(
      (left, right) => right.total - left.total,
    );
  }, [
    activeCategoryId,
    activeCategoryName,
    activeFilter,
    receiptsQuery.data,
    searchQuery,
    selectedMonth,
  ]);
  const paginatedReceipts = filteredReceipts.slice(0, currentPage * PAGE_SIZE);
  const hasMoreReceipts = paginatedReceipts.length < filteredReceipts.length;
  const receiptSections = useMemo(() => {
    const sections = new Map<
      string,
      { items: TransactionListItem[]; title: string }
    >();

    for (const receipt of paginatedReceipts) {
      const receiptDate =
        parseReceiptDate(receipt.dateText) ??
        parseReceiptDate(receipt.createdAt);
      const dateKey = receiptDate ? getDateKey(receiptDate) : "unknown";
      const section = sections.get(dateKey) ?? {
        title: receiptDate
          ? dateFormatter.format(receiptDate)
          : t("dashboard.search.unknownDate"),
        items: [],
      };

      section.items.push({
        id: receipt.id,
        icon: getReceiptIcon(receipt.categoryName),
        title: receipt.store,
        category: receipt.categoryName ?? t("dashboard.receiptFallback"),
        date: receipt.dateText ?? receipt.createdAt,
        amount: formatCurrency(receipt.total),
      });
      sections.set(dateKey, section);
    }

    return [...sections.values()];
  }, [dateFormatter, formatCurrency, paginatedReceipts, t]);

  const setSearchParam = (q: string) => {
    router.setParams({ page: "1", q });
  };
  const setCategoryFilter = (filter: FilterKey) => {
    router.setParams({ category: getFilterParam(filter), page: "1" });
  };
  const setSearchMonth = (month: Date) => {
    setSelectedMonth(month);
    router.setParams({ page: "1" });
  };
  const loadNextPage = () => {
    router.setParams({ page: String(currentPage + 1) });
  };
  const refreshSearch = () => {
    categoriesQuery.refetch();
    receiptsQuery.refetch();
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.content,
            {
              alignSelf: "center",
              maxWidth: adaptive.maxContentWidth,
              paddingBottom: getTabScreenBottomPadding(bottom, 36),
              paddingHorizontal: adaptive.gutter,
              width: "100%",
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={
                categoriesQuery.isRefetching || receiptsQuery.isRefetching
              }
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
              progressBackgroundColor={themeColors.surface}
              onRefresh={refreshSearch}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={t("dashboard.search.title")}
            subtitle={t("dashboard.search.subtitle")}
          />

          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSearchMonth}
          />

          <View
            style={[
              styles.searchGrid,
              adaptive.isMedium && styles.searchGridWide,
            ]}
          >
            <View
              style={[styles.panel, { backgroundColor: themeColors.surface }]}
            >
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
                  value={searchQuery}
                  onChangeText={setSearchParam}
                  placeholder={t("dashboard.search.placeholder")}
                  placeholderTextColor={themeColors.mutedText}
                  style={[styles.searchInput, { color: themeColors.text }]}
                />
              </View>
            </View>

            <View
              style={[styles.panel, { backgroundColor: themeColors.surface }]}
            >
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
                      onPress={() => setCategoryFilter(filter.key)}
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
          </View>

          {receiptSections.length ? (
            receiptSections.map((section) => (
              <TransactionList
                actionLabel={null}
                items={section.items}
                key={section.title}
                title={section.title}
              />
            ))
          ) : (
            <TransactionList
              actionLabel={null}
              items={[]}
              title={t("dashboard.transactionList.title")}
            />
          )}

          {hasMoreReceipts ? (
            <Pressable
              style={[
                styles.olderButton,
                { backgroundColor: themeColors.surface },
              ]}
              onPress={loadNextPage}
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
          ) : null}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  searchGrid: {
    gap: spacing.lg,
  },
  searchGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  panel: {
    flex: 1,
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
