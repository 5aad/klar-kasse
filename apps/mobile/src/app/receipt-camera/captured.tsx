import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { parseNormaReceipt } from "@/utils/receipt-parser";

export default function CapturedReceiptMlKitScreen() {
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
      <SafeAreaView style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>No receipt image found</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.stepText}>STEP 2 OF 2</Text>
          <Text style={styles.title}>Review Scan</Text>
          <Text style={styles.subtitle}>
            We&apos;ve extracted the details from your receipt. Please verify
            they are correct before adding to your gallery.
          </Text>
        </View>

        <View style={styles.previewPanel}>
          <View style={styles.statusBadge}>
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#07845f" />
            ) : (
              <MaterialCommunityIcons
                name="check-circle"
                size={13}
                color="#07845f"
              />
            )}
            <Text style={styles.statusText}>
              {isAnalyzing ? "ANALYZING SCAN" : "ANALYSIS COMPLETE"}
            </Text>
          </View>

          <Image
            source={{ uri: croppedImage.uri }}
            style={styles.receiptImage}
            contentFit="contain"
          />

          <View style={styles.previewFooter}>
            <Text numberOfLines={1} style={styles.fileName}>
              {fileName}
            </Text>
            <Pressable onPress={retakeReceipt}>
              <Text style={styles.retakeText}>Retake Scan</Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <ReviewField
          label="MERCHANT NAME"
          value={merchantName}
          onChangeText={setMerchantName}
          placeholder="Merchant name"
        />

        <View style={styles.fieldRow}>
          <ReviewField
            compact
            label="DATE"
            value={date}
            onChangeText={setDate}
            placeholder="Date"
          />
          <ReviewField
            compact
            label="AMOUNT ($)"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.selectField}>
          <View>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <TextInput
              style={styles.fieldInput}
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color="#0f172a"
          />
        </View>

        <ReviewField
          label="PERSONAL NOTE (OPTIONAL)"
          value={note}
          onChangeText={setNote}
          placeholder="Coffee with the design team..."
          multiline
        />

        <Pressable style={styles.confirmButton} onPress={confirmReceipt}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={18}
            color="#ffffff"
          />
          <Text style={styles.confirmButtonText}>Confirm & Add</Text>
        </Pressable>

        <Pressable style={styles.discardButton} onPress={discardScan}>
          <Text style={styles.discardButtonText}>DISCARD SCAN</Text>
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
};

function ReviewField({
  compact,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
}: ReviewFieldProps) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    gap: 7,
  },
  stepText: {
    color: "#027a5a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
  },
  title: {
    color: "#020617",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  previewPanel: {
    gap: 12,
    overflow: "hidden",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f1f5f4",
  },
  statusText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
  },
  receiptImage: {
    width: "100%",
    height: 252,
    backgroundColor: "#f8fafc",
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  fileName: {
    flex: 1,
    color: "#0f172a",
    fontSize: 12,
  },
  retakeText: {
    color: "#008060",
    fontSize: 12,
    fontWeight: "800",
  },
  fieldRow: {
    flexDirection: "row",
    gap: 16,
  },
  field: {
    minHeight: 78,
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  compactField: {
    flex: 1,
  },
  selectField: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  fieldLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  fieldInput: {
    minWidth: 0,
    padding: 0,
    color: "#020617",
    fontSize: 16,
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 42,
    color: "#475569",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    textAlignVertical: "top",
  },
  confirmButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#E63C3A",
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  discardButtonText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  errorText: {
    borderRadius: 8,
    padding: 12,
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
  },
  emptyScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
