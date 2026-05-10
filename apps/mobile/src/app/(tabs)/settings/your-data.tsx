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

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return {
    month: new Intl.DateTimeFormat("en", { month: "long" }).format(date),
    year,
  };
}

export default function YourDataScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const monthlyBudgetsQuery = useMonthlyBudgetsQuery();
  const deleteMonthlyBudgetMutation = useDeleteMonthlyBudgetMutation();
  const archives: DataArchive[] =
    monthlyBudgetsQuery.data?.map((budget) => {
      const label = formatMonthLabel(budget.monthKey);

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
          EUR {item.limitAmount.toLocaleString()} budget,{" "}
          {item.categoryBudgetCount} categories, {item.receiptCount} receipts
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
              body="Set a monthly budget to see export and delete options here."
              icon="database-outline"
              title="No monthly data yet"
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader
              title="Your Data"
              subtitle="Export or delete monthly spending records."
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
