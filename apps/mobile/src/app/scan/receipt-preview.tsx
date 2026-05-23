import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fontSize, radius, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import {
  applyReceiptParserHints,
  saveReceiptParserCorrection,
} from "@/api/receipt-parser-hints";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useCategoriesQuery } from "@/queries/categories";
import { usePostReceiptMutation } from "@/queries/receipts";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { formatDateInput, formatDateTextInput } from "@/utils/date-input";
import { parseReceiptBlocks } from "@/utils/receipt-block-parser";
import {
  parseNormaReceipt,
  type ReceiptParseResult,
} from "@/utils/receipt-parser";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";

type ThemeColors = ReturnType<typeof useThemeColors>;
const paymentMethods = ["Cash", "Visa", "Mastercard", "Debit"] as const;
const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  Cash: "scan.add.paymentMethods.cash",
  Visa: "scan.add.paymentMethods.visa",
  Mastercard: "scan.add.paymentMethods.mastercard",
  Debit: "scan.add.paymentMethods.debit",
};

function getPaymentMethod(value?: string) {
  const paymentMethod = paymentMethods.find(
    (method) => method.toLowerCase() === value?.toLowerCase(),
  );

  return paymentMethod ?? "Visa";
}

export default function CapturedReceiptMlKitScreen() {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { t } = useTranslation();
  const { currency } = useCurrencyFormatter();
  const categoriesQuery = useCategoriesQuery();
  const postReceiptMutation = usePostReceiptMutation();
  const croppedImage = useReceiptScanStore((state) => state.croppedImage);
  const clearReceiptImages = useReceiptScanStore(
    (state) => state.clearReceiptImages,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [date, setDate] = useState(() => formatDateInput(new Date()));
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number]>("Visa");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [parsedReceipt, setParsedReceipt] = useState<ReceiptParseResult | null>(
    null,
  );

  const fileName = useMemo(() => {
    const uri = croppedImage?.uri ?? "";
    const name = uri.split("/").at(-1);

    return name || t("scan.preview.fallbackFileName");
  }, [croppedImage?.uri, t]);
  const categoryOptions =
    categoriesQuery.data?.map((categoryItem) => categoryItem.name) ?? [];

  useEffect(() => {
    if (category || !categoryOptions.length) return;

    setCategory(categoryOptions[0]);
  }, [category, categoryOptions]);

  useEffect(() => {
    if (!croppedImage?.uri) return;

    let isMounted = true;

    const analyzeReceipt = async () => {
      setIsAnalyzing(true);
      setErrorMessage(null);

      try {
        const result = await TextRecognition.recognize(
          croppedImage.uri,
          TextRecognitionScript.LATIN,
        );
        const parserResult = result.blocks?.length
          ? parseReceiptBlocks(result.blocks)
          : parseNormaReceipt(result.text);
        const parsedReceipt = await applyReceiptParserHints(parserResult);

        console.log("ML Kit OCR Result:", result.blocks);
        console.log("Receipt parser result:", parsedReceipt);

        if (!isMounted) return;

        setMerchantName(parsedReceipt.store || "");
        setDate(parsedReceipt.date || formatDateInput(new Date()));
        setAmount(parsedReceipt.total ? parsedReceipt.total.toFixed(2) : "");
        setPaymentMethod(getPaymentMethod(parsedReceipt.paymentMethod));
        setParsedReceipt(parsedReceipt);
      } catch (error) {
        console.error("Receipt processing failed:", error);

        if (isMounted) {
          setErrorMessage(
            String(error instanceof Error ? error.message : error),
          );
        }
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
        }
      }
    };

    analyzeReceipt();

    return () => {
      isMounted = false;
    };
  }, [croppedImage?.uri]);

  const retakeReceipt = () => {
    clearReceiptImages();
    router.back();
  };

  const discardScan = () => {
    clearReceiptImages();
    router.replace("/(tabs)/(dashboard)");
  };

  const confirmReceipt = () => {
    if (parsedReceipt) {
      saveReceiptParserCorrection(parsedReceipt, {
        store: merchantName,
      });
    }

    postReceiptMutation.mutate(
      {
        address: parsedReceipt?.address ?? [],
        cardLast4: parsedReceipt?.cardLast4 ?? "",
        category,
        date,
        imageUri: croppedImage?.uri,
        items: parsedReceipt?.items ?? [],
        note,
        paymentMethod,
        rawText: parsedReceipt?.rawText ?? "",
        store: merchantName,
        total: Number(amount.replace(",", ".")) || parsedReceipt?.total || 0,
        vat: parsedReceipt?.vat ?? [],
      },
      {
        onSuccess: () => {
          clearReceiptImages();
          router.replace("/(tabs)/(dashboard)");
        },
      },
    );
  };

  if (!croppedImage?.uri) {
    return (
      <SafeAreaView
        style={[
          styles.emptyScreen,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          {t("scan.preview.emptyTitle")}
        </Text>

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: themeColors.primaryText },
            ]}
          >
            {t("scan.preview.goBack")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
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
              paddingHorizontal: adaptive.gutter,
              width: "100%",
            },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={t("scan.preview.title")}
            subtitle={t("scan.preview.subtitle")}
          />

          <View
            style={[
              styles.reviewLayout,
              adaptive.isExpanded && styles.reviewLayoutWide,
            ]}
          >
            <View
              style={[
                styles.previewColumn,
                adaptive.isExpanded && styles.previewColumnWide,
              ]}
            >
              <View
                style={[
                  styles.previewPanel,
                  { backgroundColor: themeColors.surface },
                ]}
              >
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: themeColors.background },
                  ]}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColors.primary}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={13}
                      color={themeColors.primary}
                    />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      { color: themeColors.mutedText },
                    ]}
                  >
                    {isAnalyzing
                      ? t("scan.preview.status.analyzing")
                      : t("scan.preview.status.complete")}
                  </Text>
                </View>

                <Image
                  source={{ uri: croppedImage.uri }}
                  style={[
                    styles.receiptImage,
                    adaptive.isExpanded && styles.receiptImageWide,
                    { backgroundColor: themeColors.background },
                  ]}
                  contentFit="contain"
                />

                <View style={styles.previewFooter}>
                  <Text
                    numberOfLines={1}
                    style={[styles.fileName, { color: themeColors.text }]}
                  >
                    {fileName}
                  </Text>
                  <Pressable onPress={retakeReceipt}>
                    <Text
                      style={[
                        styles.retakeText,
                        { color: themeColors.primary },
                      ]}
                    >
                      {t("scan.preview.retake")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {errorMessage ? (
                <Text
                  style={[
                    styles.errorText,
                    {
                      backgroundColor: `${themeColors.primary}26`,
                      color: themeColors.primary,
                    },
                  ]}
                >
                  {errorMessage}
                </Text>
              ) : null}
            </View>

            <View style={styles.formColumn}>
              <ReviewField
                label={t("scan.preview.fields.merchant")}
                value={merchantName}
                onChangeText={setMerchantName}
                placeholder={t("scan.preview.placeholders.merchant")}
                themeColors={themeColors}
              />

              <View
                style={[
                  styles.fieldRow,
                  adaptive.isMedium && styles.fieldRowWide,
                ]}
              >
                <ReviewField
                  compact
                  label={t("scan.preview.fields.date")}
                  value={date}
                  onChangeText={(value) => setDate(formatDateTextInput(value))}
                  placeholder={t("scan.preview.placeholders.date")}
                  keyboardType="number-pad"
                  themeColors={themeColors}
                />
                <ReviewField
                  compact
                  label={t("scan.preview.fields.amount", { currency })}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={t("scan.preview.placeholders.amount")}
                  keyboardType="decimal-pad"
                  themeColors={themeColors}
                />
              </View>

              <ChoiceGroup
                emptyText={t("scan.preview.emptyCategories")}
                label={t("scan.preview.fields.category")}
                options={categoryOptions}
                value={category}
                onChange={setCategory}
              />

              <ChoiceGroup
                getOptionLabel={(option) => t(paymentMethodLabels[option])}
                label={t("scan.preview.fields.payment")}
                options={paymentMethods}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />

              <ReviewField
                label={t("scan.preview.fields.note")}
                value={note}
                onChangeText={setNote}
                placeholder={t("scan.preview.placeholders.note")}
                multiline
                themeColors={themeColors}
              />

              <Pressable
                style={[
                  styles.confirmButton,
                  { backgroundColor: themeColors.primary },
                  postReceiptMutation.isPending && styles.disabled,
                ]}
                disabled={postReceiptMutation.isPending}
                onPress={confirmReceipt}
              >
                <MaterialCommunityIcons
                  name={
                    postReceiptMutation.isPending ? "timer-sand" : "plus-circle"
                  }
                  size={18}
                  color={themeColors.primaryText}
                />
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: themeColors.primaryText },
                  ]}
                >
                  {postReceiptMutation.isPending
                    ? t("scan.preview.saving")
                    : t("scan.preview.confirm")}
                </Text>
              </Pressable>

              <Pressable style={styles.discardButton} onPress={discardScan}>
                <Text
                  style={[
                    styles.discardButtonText,
                    { color: themeColors.text },
                  ]}
                >
                  {t("scan.preview.discard")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ReviewFieldProps = {
  compact?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  themeColors: ThemeColors;
};

function ReviewField({
  compact,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
  themeColors,
}: ReviewFieldProps) {
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: themeColors.surface },
        compact && styles.compactField,
      ]}
    >
      <Text style={[styles.fieldLabel, { color: themeColors.mutedText }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.fieldInput,
          { color: themeColors.text },
          multiline && styles.multilineInput,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.mutedText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function ChoiceGroup<TValue extends string>({
  emptyText,
  getOptionLabel,
  label,
  onChange,
  options,
  value,
}: {
  emptyText?: string;
  getOptionLabel?: (value: TValue) => string;
  label: string;
  onChange: (value: TValue) => void;
  options: readonly TValue[];
  value: TValue;
}) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.choiceLabel, { color: themeColors.text }]}>
        {label}
      </Text>
      <View style={styles.choiceList}>
        {options.length ? (
          options.map((option) => {
            const isSelected = option === value;

            return (
              <Pressable
                key={option}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: isSelected
                      ? themeColors.primary
                      : themeColors.surface,
                  },
                ]}
                onPress={() => onChange(option)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    {
                      color: isSelected
                        ? themeColors.primaryText
                        : themeColors.text,
                    },
                  ]}
                >
                  {getOptionLabel ? getOptionLabel(option) : option}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text
            style={[styles.choiceEmptyText, { color: themeColors.mutedText }]}
          >
            {emptyText}
          </Text>
        )}
      </View>
    </View>
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
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  reviewLayout: {
    gap: spacing.md,
  },
  reviewLayoutWide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },
  previewColumn: {
    gap: spacing.md,
  },
  previewColumnWide: {
    flex: 0.95,
    minWidth: 0,
  },
  formColumn: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 21,
  },
  previewPanel: {
    gap: spacing.md,
    overflow: "hidden",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  receiptImage: {
    width: "100%",
    height: 252,
  },
  receiptImageWide: {
    height: 520,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  fileName: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  retakeText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  fieldRow: {
    gap: spacing.md,
  },
  fieldRowWide: {
    flexDirection: "row",
  },
  field: {
    minHeight: 78,
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  compactField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  choiceSection: {
    gap: spacing.sm,
  },
  choiceLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
  choiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  choiceText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  choiceEmptyText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  fieldInput: {
    minWidth: 0,
    padding: 0,
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  multilineInput: {
    minHeight: 42,
    fontSize: fontSize.sm,
    fontWeight: "500",
    lineHeight: 18,
    textAlignVertical: "top",
  },
  confirmButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  confirmButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  discardButtonText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    letterSpacing: 2,
  },
  errorText: {
    borderRadius: radius.md,
    padding: 12,
  },
  emptyScreen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "500",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.55,
  },
});
