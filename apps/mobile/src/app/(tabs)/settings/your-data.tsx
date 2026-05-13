import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useDeleteMonthlyBudgetMutation,
  useMonthlyBudgetsQuery,
} from "@/queries/budgets";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type DataArchive = {
  categoryBudgetCount: number;
  id: string;
  limitAmount: number;
  month: string;
  monthKey: string;
  receiptCount: number;
  spentAmount: number;
  year: string;
};

function formatMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return {
    month: new Intl.DateTimeFormat(locale, { month: "long" }).format(date),
    year,
  };
}

export default function YourDataScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const monthlyBudgetsQuery = useMonthlyBudgetsQuery();
  const deleteMonthlyBudgetMutation = useDeleteMonthlyBudgetMutation();
  const archives: DataArchive[] =
    monthlyBudgetsQuery.data?.map((budget) => {
      const label = formatMonthLabel(budget.monthKey, i18n.language);

      return {
        id: budget.id,
        monthKey: budget.monthKey,
        month: label.month,
        year: label.year,
        limitAmount: budget.limitAmount,
        spentAmount: budget.spentAmount,
        receiptCount: budget.receiptCount,
        categoryBudgetCount: budget.categoryBudgetCount,
      };
    }) ?? [];

  const renderArchiveItem: ListRenderItem<DataArchive> = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.text,
        },
      ]}
    >
      <View style={[styles.archiveIcon, { backgroundColor: "black" }]}>
        <MaterialCommunityIcons
          color={themeColors.primaryText}
          name="calendar-month-outline"
          size={28}
        />
      </View>

      <View style={styles.archiveCopy}>
        <Text style={[styles.archiveTitle, { color: themeColors.text }]}>
          {item.month} {item.year}
        </Text>
        <Text style={[styles.archiveMeta, { color: themeColors.mutedText }]}>
          {t("settings.yourData.archiveMeta", {
            budget: item.limitAmount.toLocaleString(),
            categories: item.categoryBudgetCount,
            receipts: item.receiptCount,
          })}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: themeColors.primary }]}
        >
          <MaterialCommunityIcons
            color={themeColors.primaryText}
            name="export-variant"
            size={20}
          />
        </Pressable>
        <Pressable
          style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
          disabled={deleteMonthlyBudgetMutation.isPending}
          onPress={() => deleteMonthlyBudgetMutation.mutate(item.monthKey)}
        >
          <MaterialCommunityIcons
            color={themeColors.primary}
            name="trash-can-outline"
            size={20}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <FlatList
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 36) },
        ]}
        data={archives}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={monthlyBudgetsQuery.isRefetching}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
            progressBackgroundColor={themeColors.surface}
            onRefresh={monthlyBudgetsQuery.refetch}
          />
        }
        ListEmptyComponent={
          monthlyBudgetsQuery.isLoading ? null : (
            <EmptyStateCard
              body={t("settings.yourData.emptyBody")}
              icon="database-outline"
              title={t("settings.yourData.emptyTitle")}
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader
              title={t("settings.yourData.title")}
              subtitle={t("settings.yourData.subtitle")}
            />
          </View>
        }
        renderItem={renderArchiveItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  card: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  archiveIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  archiveCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  archiveTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  archiveMeta: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
});
