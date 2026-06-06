import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import type { ReceiptLlmJobStatus } from "@/utils/receipt-llm-jobs-model";

export type TransactionListItem = {
  amount: string;
  category: string;
  date: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  id?: string;
  llmJobStatus?: ReceiptLlmJobStatus | null;
  llmStatusLabel?: string | null;
  title: string;
};

type Props = {
  actionLabel?: string | null;
  items?: readonly TransactionListItem[];
  title?: string;
};

export function TransactionList({ actionLabel, items = [], title }: Props) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const { t } = useTranslation();
  const resolvedActionLabel =
    actionLabel === undefined
      ? t("dashboard.transactionList.viewAll")
      : actionLabel;
  const resolvedTitle = title ?? t("dashboard.transactionList.title");
  const iconBackground =
    resolvedTheme === "dark" ? themeColors.text : themeColors.text;
  const iconColor =
    resolvedTheme === "dark" ? themeColors.background : themeColors.primaryText;
  const hasProcessingReceipt = items.some(
    (transaction) => transaction.llmJobStatus === "processing",
  );
  const borderPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasProcessingReceipt) {
      borderPulse.stopAnimation();
      borderPulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: false,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 850,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [borderPulse, hasProcessingReceipt]);

  const processingBorderColor = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [`${themeColors.primary}33`, themeColors.primary],
  });

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {resolvedTitle}
        </Text>
        {resolvedActionLabel ? (
          <Pressable onPress={() => router.push("/(dashboard)/search")}>
            <Text style={[styles.viewAll, { color: themeColors.primary }]}>
              {resolvedActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {items.length ? (
          items.map((transaction) => (
            <Animated.View
              key={transaction.id ?? `${transaction.title}-${transaction.date}`}
              style={[
                styles.rowFrame,
                transaction.llmJobStatus === "processing" && {
                  borderColor: processingBorderColor,
                },
              ]}
            >
              <Pressable
                style={styles.row}
                accessibilityLabel={t("dashboard.transactionList.openReceipt", {
                  title: transaction.title,
                })}
                accessibilityRole={transaction.id ? "button" : undefined}
                disabled={!transaction.id}
                onPress={() => {
                  if (!transaction.id) return;

                  router.push(`/(dashboard)/receipt/${transaction.id}`);
                }}
              >
                <View
                  style={[styles.iconBox, { backgroundColor: iconBackground }]}
                >
                  <MaterialCommunityIcons
                    color={iconColor}
                    name={transaction.icon}
                    size={26}
                  />
                </View>
                <View style={styles.copy}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: themeColors.text },
                    ]}
                  >
                    {transaction.title}
                  </Text>
                  <Text
                    style={[
                      styles.transactionSubtitle,
                      { color: themeColors.mutedText },
                    ]}
                  >
                    {transaction.category} | {transaction.date}
                  </Text>
                  {transaction.llmStatusLabel ? (
                    <Text
                      style={[
                        styles.aiStatusText,
                        {
                          color:
                            transaction.llmJobStatus === "failed"
                              ? themeColors.primary
                              : themeColors.mutedText,
                        },
                      ]}
                    >
                      {transaction.llmStatusLabel}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: themeColors.text,
                    },
                  ]}
                >
                  {transaction.amount}
                </Text>
              </Pressable>
            </Animated.View>
          ))
        ) : (
          <EmptyStateCard
            body={t("dashboard.transactionList.emptyBody")}
            icon="receipt-text-outline"
            title={t("dashboard.transactionList.emptyTitle")}
          />
        )}
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
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  viewAll: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
  rowFrame: {
    borderLeftWidth: 3,
    borderColor: "transparent",
    borderRadius: radius.sm,
    paddingLeft: spacing.sm,
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
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  transactionTitle: {
    fontSize: 22,
    fontWeight: "500",
  },
  transactionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  aiStatusText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  amount: {
    fontSize: 22,
    fontWeight: "500",
  },
});
