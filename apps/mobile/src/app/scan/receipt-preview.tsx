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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { usePostReceiptMutation } from "@/queries/receipts";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import {
  parseNormaReceipt,
  type ReceiptParseResult,
} from "@/utils/receipt-parser";

type ThemeColors = ReturnType<typeof useThemeColors>;

export default function CapturedReceiptMlKitScreen() {
  const themeColors = useThemeColors();
  const { t } = useTranslation();
  const postReceiptMutation = usePostReceiptMutation();
  const croppedImage = useReceiptScanStore((state) => state.croppedImage);
  const clearReceiptImages = useReceiptScanStore(
    (state) => state.clearReceiptImages,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(() =>
    t("scan.preview.defaultCategory"),
  );
  const [note, setNote] = useState("");
  const [parsedReceipt, setParsedReceipt] = useState<ReceiptParseResult | null>(
    null,
  );

  const fileName = useMemo(() => {
    const uri = croppedImage?.uri ?? "";
    const name = uri.split("/").at(-1);

    return name || t("scan.preview.fallbackFileName");
  }, [croppedImage?.uri, t]);

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
        const parsedReceipt = parseNormaReceipt(result.text);

        console.log("ML Kit OCR Result:", result.text);
        console.log("Receipt parser result:", parsedReceipt);

        if (!isMounted) return;

        setMerchantName(parsedReceipt.store || "");
        setDate(parsedReceipt.date || "");
        setAmount(parsedReceipt.total ? parsedReceipt.total.toFixed(2) : "");
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
    postReceiptMutation.mutate(
      {
        address: parsedReceipt?.address ?? [],
        cardLast4: parsedReceipt?.cardLast4 ?? "",
        category,
        date,
        imageUri: croppedImage?.uri,
        items: parsedReceipt?.items ?? [],
        note,
        paymentMethod: parsedReceipt?.paymentMethod ?? "",
        rawText: parsedReceipt?.rawText ?? "",
        store: merchantName,
        time: parsedReceipt?.time ?? "",
        total: Number(amount.replace(",", ".")) || parsedReceipt?.total || 0,
        vat: parsedReceipt?.vat ?? [],
      },
      {
        onSuccess: () => {
          clearReceiptImages();
          router.replace("/(tabs)/scan");
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("scan.preview.title")}
          subtitle={t("scan.preview.subtitle")}
        />

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
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="check-circle"
                size={13}
                color={themeColors.primary}
              />
            )}
            <Text style={[styles.statusText, { color: themeColors.mutedText }]}>
              {isAnalyzing
                ? t("scan.preview.status.analyzing")
                : t("scan.preview.status.complete")}
            </Text>
          </View>

          <Image
            source={{ uri: croppedImage.uri }}
            style={[
              styles.receiptImage,
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
              <Text style={[styles.retakeText, { color: themeColors.primary }]}>
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

        <ReviewField
          label={t("scan.preview.fields.merchant")}
          value={merchantName}
          onChangeText={setMerchantName}
          placeholder={t("scan.preview.placeholders.merchant")}
          themeColors={themeColors}
        />

        <View style={styles.fieldRow}>
          <ReviewField
            compact
            label={t("scan.preview.fields.date")}
            value={date}
            onChangeText={setDate}
            placeholder={t("scan.preview.placeholders.date")}
            themeColors={themeColors}
          />
          <ReviewField
            compact
            label={t("scan.preview.fields.amount")}
            value={amount}
            onChangeText={setAmount}
            placeholder={t("scan.preview.placeholders.amount")}
            keyboardType="decimal-pad"
            themeColors={themeColors}
          />
        </View>

        <View
          style={[styles.selectField, { backgroundColor: themeColors.surface }]}
        >
          <View>
            <Text style={[styles.fieldLabel, { color: themeColors.mutedText }]}>
              {t("scan.preview.fields.category")}
            </Text>
            <TextInput
              style={[styles.fieldInput, { color: themeColors.text }]}
              value={category}
              onChangeText={setCategory}
              placeholder={t("scan.preview.placeholders.category")}
              placeholderTextColor={themeColors.mutedText}
            />
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={themeColors.text}
          />
        </View>

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
            name={postReceiptMutation.isPending ? "timer-sand" : "plus-circle"}
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
          <Text style={[styles.discardButtonText, { color: themeColors.text }]}>
            {t("scan.preview.discard")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type ReviewFieldProps = {
  compact?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
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
    fontWeight: "800",
  },
  receiptImage: {
    width: "100%",
    height: 252,
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
    fontWeight: "800",
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
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
  selectField: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  fieldInput: {
    minWidth: 0,
    padding: 0,
    fontSize: fontSize.lg,
    fontWeight: "700",
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
    fontWeight: "800",
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  discardButtonText: {
    fontSize: fontSize.xs,
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
});
