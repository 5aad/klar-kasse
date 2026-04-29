import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";

const dataArchives = [
  { id: "2026-04", month: "April", year: "2026", items: 42 },
  { id: "2026-03", month: "March", year: "2026", items: 38 },
  { id: "2026-02", month: "February", year: "2026", items: 31 },
  { id: "2026-01", month: "January", year: "2026", items: 29 },
  { id: "2025-12", month: "December", year: "2025", items: 45 },
];

export default function YourDataScreen() {
  const themeColors = useThemeColors();

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
          {item.items} receipts and transactions
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
        contentContainerStyle={styles.content}
        data={dataArchives}
        keyExtractor={(item) => item.id}
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

type DataArchive = (typeof dataArchives)[number];

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
