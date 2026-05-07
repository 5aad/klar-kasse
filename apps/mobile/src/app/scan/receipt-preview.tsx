import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fontSize, radius, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { parseNormaReceipt } from "@/utils/receipt-parser";

type ThemeColors = ReturnType<typeof useThemeColors>;

export default function CapturedReceiptMlKitScreen() {
  const themeColors = useThemeColors();
  const croppedImage = useReceiptScanStore((state) => state.croppedImage);
  const clearReceiptImages = useReceiptScanStore(
    (state) => state.clearReceiptImages,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [note, setNote] = useState("");

  const fileName = useMemo(() => {
    const uri = croppedImage?.uri ?? "";
    const name = uri.split("/").at(-1);

    return name || "receipt.jpg";
  }, [croppedImage?.uri]);

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
    router.replace("/");
  };

  const confirmReceipt = () => {
    console.log("Confirmed receipt:", {
      merchantName,
      date,
      amount,
      category,
      note,
    });
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
          No receipt image found
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
            Go back
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
          title="Review Scan"
          subtitle="Verify the extracted receipt details before adding them."
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
              {isAnalyzing ? "ANALYZING SCAN" : "ANALYSIS COMPLETE"}
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
                Retake Scan
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
          label="MERCHANT NAME"
          value={merchantName}
          onChangeText={setMerchantName}
          placeholder="Merchant name"
          themeColors={themeColors}
        />

        <View style={styles.fieldRow}>
          <ReviewField
            compact
            label="DATE"
            value={date}
            onChangeText={setDate}
            placeholder="Date"
            themeColors={themeColors}
          />
          <ReviewField
            compact
            label="AMOUNT ($)"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            themeColors={themeColors}
          />
        </View>

        <View
          style={[styles.selectField, { backgroundColor: themeColors.surface }]}
        >
          <View>
            <Text style={[styles.fieldLabel, { color: themeColors.mutedText }]}>
              CATEGORY
            </Text>
            <TextInput
              style={[styles.fieldInput, { color: themeColors.text }]}
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
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
          label="PERSONAL NOTE (OPTIONAL)"
          value={note}
          onChangeText={setNote}
          placeholder="Coffee with the design team..."
          multiline
          themeColors={themeColors}
        />

        <Pressable
          style={[
            styles.confirmButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={confirmReceipt}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={18}
            color={themeColors.primaryText}
          />
          <Text
            style={[
              styles.confirmButtonText,
              { color: themeColors.primaryText },
            ]}
          >
            Confirm & Add
          </Text>
        </Pressable>

        <Pressable style={styles.discardButton} onPress={discardScan}>
          <Text style={[styles.discardButtonText, { color: themeColors.text }]}>
            DISCARD SCAN
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
});
