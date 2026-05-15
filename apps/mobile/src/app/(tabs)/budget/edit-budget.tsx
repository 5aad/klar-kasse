import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type GestureResponderEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useEditCategoryMutation } from "@/queries/categories";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";

export default function EditBudgetScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { currency, formatCurrency } = useCurrencyFormatter();
  const editCategoryMutation = useEditCategoryMutation();
  const params = useLocalSearchParams<{
    id?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    limit?: string;
    name?: string;
    spent?: string;
    type?: string;
  }>();
  const name = params.name ?? t("budget.edit.defaultCategoryName");
  const type = params.type ?? t("budget.edit.defaultCategoryType");
  const icon = params.icon ?? "cart";
  const spent = Number(params.spent ?? 428.5);
  const limit = Number(params.limit ?? 600);
  const [categoryName, setCategoryName] = useState(name);
  const [limitValue, setLimitValue] = useState(limit.toFixed(2));
  const [proportion, setProportion] = useState(0.58);
  const sliderWidthRef = useRef(1);
  const dragStartProportionRef = useRef(0.58);
  // const proportionPercent = Math.round(proportion * 100);

  const saveChanges = () => {
    if (!params.id) {
      router.back();
      return;
    }

    editCategoryMutation.mutate(
      {
        id: params.id,
        name: categoryName,
        limit: Number(limitValue.replace(",", ".").replace(/[^\d.]/g, "")) || 0,
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const clampProportion = (value: number) => Math.max(0, Math.min(1, value));

  const updateProportionFromLocation = (event: GestureResponderEvent) => {
    setProportion(
      clampProportion(
        event.nativeEvent.locationX / Math.max(sliderWidthRef.current, 1),
      ),
    );
  };

  // const sliderPanResponder = useMemo(
  //   () =>
  //     PanResponder.create({
  //       onMoveShouldSetPanResponder: () => true,
  //       onStartShouldSetPanResponder: () => true,
  //       onPanResponderGrant: (event) => {
  //         dragStartProportionRef.current = proportion;
  //         updateProportionFromLocation(event);
  //       },
  //       onPanResponderMove: (_, gestureState) => {
  //         setProportion(
  //           clampProportion(
  //             dragStartProportionRef.current +
  //               gestureState.dx / Math.max(sliderWidthRef.current, 1),
  //           ),
  //         );
  //       },
  //     }),
  //   [proportion],
  // );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 42) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("budget.edit.title")}
          subtitle={t("budget.edit.subtitle")}
        />

        <View
          style={[styles.currentCard, { backgroundColor: themeColors.surface }]}
        >
          <View
            style={[
              styles.currentAccent,
              { backgroundColor: themeColors.primary },
            ]}
          />
          <View style={styles.currentHeader}>
            <View style={styles.currentCopy}>
              <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
                {t("budget.edit.currentAllocation")}
              </Text>
              <TextInput
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder={t("budget.edit.categoryNamePlaceholder")}
                placeholderTextColor={themeColors.mutedText}
                style={[styles.titleInput, { color: themeColors.text }]}
              />
              <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
                {formatType(type)}
              </Text>
            </View>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${themeColors.primary}26` },
              ]}
            >
              <MaterialCommunityIcons
                color={themeColors.primary}
                name={icon}
                size={34}
              />
            </View>
          </View>

          <View style={styles.statRow}>
            <View
              style={[
                styles.statBox,
                { backgroundColor: themeColors.background },
              ]}
            >
              <Text
                style={[styles.statLabel, { color: themeColors.mutedText }]}
              >
                {t("budget.edit.used")}
              </Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatCurrency(spent)}
              </Text>
            </View>
            <View
              style={[
                styles.statBox,
                { backgroundColor: themeColors.background },
              ]}
            >
              <Text
                style={[styles.statLabel, { color: themeColors.mutedText }]}
              >
                {t("budget.edit.currentLimit")}
              </Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatCurrency(limit)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.mutedText }]}>
            {t("budget.edit.newMonthlyLimit")}
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            style={[
              styles.amountInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.text,
                color: themeColors.text,
              },
            ]}
            value={`${currency} ${limitValue}`}
            onChangeText={(value) =>
              setLimitValue(value.replace(/[^\d.]/g, ""))
            }
          />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              color={themeColors.mutedText}
              name="information"
              size={16}
            />
            <Text style={[styles.infoText, { color: themeColors.mutedText }]}>
              {t("budget.edit.limitInfo")}
            </Text>
          </View>
        </View>

        {/* <View style={styles.section}>
          <View style={styles.proportionHeader}>
            <Text
              style={[styles.sectionLabel, { color: themeColors.mutedText }]}
            >
              ADJUST PROPORTION
            </Text>
            <Text style={[styles.proportionText, { color: themeColors.text }]}>
              {proportionPercent}% of total income
            </Text>
          </View>

          <Pressable
            style={[
              styles.sliderTrack,
              { backgroundColor: themeColors.mutedText },
            ]}
            onLayout={(event) => {
              sliderWidthRef.current = event.nativeEvent.layout.width;
            }}
            onPress={updateProportionFromLocation}
            {...sliderPanResponder.panHandlers}
          >
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: themeColors.text,
                  width: `${proportion * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.text,
                  left: `${proportion * 100}%`,
                },
              ]}
            />
          </Pressable>

          <View style={styles.sliderLabels}>
            <Text
              style={[styles.sliderLabel, { color: themeColors.mutedText }]}
            >
              100
            </Text>
            <Text
              style={[styles.sliderLabel, { color: themeColors.mutedText }]}
            >
              1,200
            </Text>
          </View>
        </View> */}

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: themeColors.primary },
            editCategoryMutation.isPending && styles.disabled,
          ]}
          disabled={editCategoryMutation.isPending}
          onPress={saveChanges}
        >
          <MaterialCommunityIcons
            color={themeColors.primaryText}
            name="content-save-outline"
            size={20}
          />
          <Text style={[styles.saveText, { color: themeColors.primaryText }]}>
            {editCategoryMutation.isPending
              ? t("budget.edit.saving")
              : t("budget.edit.saveChanges")}
          </Text>
        </Pressable>

        <Pressable style={styles.discardButton} onPress={() => router.back()}>
          <Text style={[styles.discardText, { color: themeColors.mutedText }]}>
            {t("budget.edit.discardEdits")}
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function formatType(type: string) {
  return type.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 42,
  },
  currentCard: {
    overflow: "hidden",
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.16)",
  },
  currentAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  currentCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 31,
    fontWeight: "700",
  },
  titleInput: {
    margin: 0,
    padding: 0,
    fontSize: 31,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  iconBox: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  amountInput: {
    minHeight: 98,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 42,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  proportionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  proportionText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  sliderTrack: {
    height: 14,
    justifyContent: "center",
    borderRadius: 999,
  },
  sliderFill: {
    height: "100%",
    borderRadius: 999,
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: radius.sm,
    borderWidth: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  saveText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  discardButton: {
    alignItems: "center",
  },
  discardText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
});
