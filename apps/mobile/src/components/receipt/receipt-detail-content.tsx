import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { ScreenHeader } from "@/components/shared/screen-header";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useDeleteReceiptMutation, useReceiptQuery } from "@/queries/receipts";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type Props = {
  receiptId: string;
};

export function ReceiptDetailContent({ receiptId }: Props) {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormatter();
  const receiptQuery = useReceiptQuery(receiptId);
  const deleteReceiptMutation = useDeleteReceiptMutation();
  const receipt = receiptQuery.data;
  const itemTotal = useMemo(() => {
    if (!receipt) return 0;
    if (!receipt.items.length) return receipt.total;

    return receipt.items.reduce((total, item) => total + item.price, 0);
  }, [receipt]);

  function confirmDeleteReceipt() {
    if (!receipt) return;

    Alert.alert(
      t("receiptDetail.deleteTitle"),
      t("receiptDetail.deleteBody", { store: receipt.store }),
      [
        { style: "cancel", text: t("common.cancel") },
        {
          style: "destructive",
          text: t("receiptDetail.deleteConfirm"),
          onPress: () => {
            deleteReceiptMutation.mutate(receipt.id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            alignSelf: "center",
            maxWidth: adaptive.isExpanded ? 820 : adaptive.maxFormWidth,
            paddingBottom: getTabScreenBottomPadding(bottom, 36),
            paddingHorizontal: adaptive.gutter,
            width: "100%",
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("receiptDetail.title")}
          subtitle={receipt?.store ?? t("receiptDetail.subtitle")}
        />

        {receiptQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={themeColors.primary} size="large" />
          </View>
        ) : receipt ? (
          <>
            <View
              style={[
                styles.receiptPaper,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.receiptHeader}>
                <View
                  style={[
                    styles.receiptIcon,
                    { backgroundColor: themeColors.text },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={themeColors.background}
                    name="receipt-text-outline"
                    size={30}
                  />
                </View>
                <View style={styles.receiptHeaderCopy}>
                  <Text
                    selectable
                    style={[styles.store, { color: themeColors.text }]}
                  >
                    {receipt.store}
                  </Text>
                  <Text
                    selectable
                    style={[styles.muted, { color: themeColors.mutedText }]}
                  >
                    {receipt.dateText ?? receipt.createdAt}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.divider, { borderColor: themeColors.border }]}
              />

              <View
                style={[
                  styles.metaGrid,
                  adaptive.isMedium && styles.metaGridWide,
                ]}
              >
                <DetailValue
                  label={t("receiptDetail.fields.category")}
                  value={receipt.categoryName ?? t("receiptDetail.fallback")}
                />
                <DetailValue
                  label={t("receiptDetail.fields.payment")}
                  value={
                    [receipt.paymentMethod, receipt.cardLast4]
                      .filter(Boolean)
                      .join(" ") || t("receiptDetail.fallback")
                  }
                />
                {receipt.address.length ? (
                  <DetailValue
                    label={t("receiptDetail.fields.address")}
                    value={receipt.address.join(", ")}
                  />
                ) : null}
                {receipt.note ? (
                  <DetailValue
                    label={t("receiptDetail.fields.note")}
                    value={receipt.note}
                  />
                ) : null}
              </View>

              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  {t("receiptDetail.items")}
                </Text>
                {receipt.items.length ? (
                  receipt.items.map((item) => (
                    <View key={item.id} style={styles.lineItem}>
                      <View style={styles.lineCopy}>
                        <Text
                          selectable
                          style={[
                            styles.lineTitle,
                            { color: themeColors.text },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          selectable
                          style={[
                            styles.muted,
                            { color: themeColors.mutedText },
                          ]}
                        >
                          {[
                            item.quantity
                              ? t("receiptDetail.quantity", {
                                  quantity: item.quantity,
                                })
                              : null,
                            item.unitPrice
                              ? formatCurrency(item.unitPrice)
                              : null,
                            item.vatCode,
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </Text>
                      </View>
                      <Text
                        selectable
                        style={[styles.lineAmount, { color: themeColors.text }]}
                      >
                        {formatCurrency(item.price)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    selectable
                    style={[styles.muted, { color: themeColors.mutedText }]}
                  >
                    {t("receiptDetail.noItems")}
                  </Text>
                )}
              </View>

              {receipt.vat.length ? (
                <>
                  <View
                    style={[
                      styles.divider,
                      { borderColor: themeColors.border },
                    ]}
                  />
                  <View style={styles.section}>
                    <Text
                      style={[styles.sectionTitle, { color: themeColors.text }]}
                    >
                      {t("receiptDetail.vat")}
                    </Text>
                    {receipt.vat.map((vatLine) => (
                      <View key={vatLine.id} style={styles.taxRow}>
                        <Text
                          selectable
                          style={[
                            styles.muted,
                            { color: themeColors.mutedText },
                          ]}
                        >
                          {vatLine.rate}%
                        </Text>
                        <Text
                          selectable
                          style={[
                            styles.muted,
                            { color: themeColors.mutedText },
                          ]}
                        >
                          {t("receiptDetail.netTax", {
                            net: formatCurrency(vatLine.net),
                            tax: formatCurrency(vatLine.tax),
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <View
                style={[styles.divider, { borderColor: themeColors.border }]}
              />

              <View style={styles.totalRows}>
                <SummaryRow
                  label={t("receiptDetail.subtotal")}
                  value={formatCurrency(itemTotal)}
                />
                <SummaryRow
                  emphasized
                  label={t("receiptDetail.total")}
                  value={formatCurrency(receipt.total)}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={deleteReceiptMutation.isPending}
              style={[
                styles.deleteButton,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.primary,
                },
                deleteReceiptMutation.isPending && styles.disabled,
              ]}
              onPress={confirmDeleteReceipt}
            >
              {deleteReceiptMutation.isPending ? (
                <ActivityIndicator color={themeColors.primary} size="small" />
              ) : (
                <MaterialCommunityIcons
                  color={themeColors.primary}
                  name="trash-can-outline"
                  size={20}
                />
              )}
              <Text style={[styles.deleteText, { color: themeColors.primary }]}>
                {deleteReceiptMutation.isPending
                  ? t("receiptDetail.deleting")
                  : t("receiptDetail.deleteAction")}
              </Text>
            </Pressable>
          </>
        ) : (
          <EmptyStateCard
            body={t("receiptDetail.emptyBody")}
            icon="receipt-text-remove-outline"
            title={t("receiptDetail.emptyTitle")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();

  return (
    <View
      style={[styles.detailValue, adaptive.isMedium && styles.detailValueWide]}
    >
      <Text style={[styles.detailLabel, { color: themeColors.mutedText }]}>
        {label}
      </Text>
      <Text selectable style={[styles.detailText, { color: themeColors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({
  emphasized,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          emphasized ? styles.totalLabel : styles.summaryLabel,
          { color: emphasized ? themeColors.text : themeColors.mutedText },
        ]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[
          emphasized ? styles.totalAmount : styles.summaryAmount,
          { color: themeColors.text },
        ]}
      >
        {value}
      </Text>
    </View>
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
  loadingWrap: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptPaper: {
    gap: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  receiptIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  receiptHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  store: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  muted: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  metaGrid: {
    gap: spacing.md,
  },
  metaGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailValue: {
    gap: spacing.xs,
  },
  detailValueWide: {
    width: "48%",
    minWidth: 240,
    flexGrow: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  detailText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  lineItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  lineCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  lineTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  lineAmount: {
    fontSize: fontSize.md,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  taxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  totalRows: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  summaryAmount: {
    fontSize: fontSize.md,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  totalLabel: {
    fontSize: fontSize.xl,
    fontWeight: "900",
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  deleteButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  deleteText: {
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.55,
  },
});
