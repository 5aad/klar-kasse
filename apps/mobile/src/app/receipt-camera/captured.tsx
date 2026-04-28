import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReceiptJsonCleaner } from "@/hooks/use-receipt-json-cleaner";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
import { parseNormaReceipt } from "@/utils/receipt-parser";

export default function CapturedReceiptMlKitScreen() {
  const [ocrText, setOcrText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const croppedImage = useReceiptScanStore((state) => state.croppedImage);
const { cleanReceiptJson, isReady, isGenerating, downloadProgress } = useReceiptJsonCleaner();
  const clearReceiptImages = useReceiptScanStore(
    (state) => state.clearReceiptImages,
  );

  const retakeReceipt = () => {
    clearReceiptImages();
    router.back();
  };

  const runModel = async () => {
    if (
      !croppedImage?.uri ||
      isRecognizing ||
      isGenerating ||
      !isReady
    ) {
      if (!isReady) {
        setErrorMessage(
          `Receipt cleaner is still loading (${Math.round(
            downloadProgress * 100
          )}%). Try again when it is ready.`,
        );
      }
      return;
    }

    setIsRecognizing(true);
    setErrorMessage(null);

    try {
      const result = await TextRecognition.recognize(
        croppedImage.uri,
        TextRecognitionScript.LATIN,
      );
      const lines = result.blocks.flatMap((block) =>
        block.lines.map((line) => line.text),
      );
      const text = lines.length > 0 ? lines.join("\n") : result.text;

      setOcrText(result.text);
      console.log("ML Kit OCR Result:", result.text);
      const parsedReceipt = parseNormaReceipt(result.text);
      console.log(parsedReceipt);
      const llmResult = await cleanReceiptJson(parsedReceipt);
      console.log("LLM Result:", llmResult);
    } catch (err) {
      console.error("Receipt processing failed:", err);
      setErrorMessage(String(err instanceof Error ? err.message : err));
    } finally {
      setIsRecognizing(false);
    }
  };

  if (!croppedImage?.uri) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>No receipt image found</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Image
        source={{ uri: croppedImage.uri }}
        style={styles.receiptImage}
        contentFit="contain"
      />

      {ocrText ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{ocrText}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={retakeReceipt}>
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryButton,
            (isRecognizing || isGenerating || !isReady) &&
              styles.disabledButton,
          ]}
          onPress={runModel}
          disabled={isRecognizing || isGenerating || !isReady}
        >
          {isRecognizing || isGenerating ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isReady
                ? "Read Receipt"
                : `Loading Cleaner ${Math.round(downloadProgress * 100)}%`}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  receiptImage: {
    flex: 1,
    backgroundColor: "#ffffff",
    filter: [
      { grayscale: 1 },
      { contrast: 4 },
      { brightness: 1 },
      { saturate: 0 },
    ],
  },
  footer: {
    padding: 16,
    backgroundColor: "#111827",
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
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  resultBox: {
    maxHeight: 180,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  resultText: {
    color: "#111827",
    fontSize: 14,
  },
  errorText: {
    padding: 12,
    color: "#ef4444",
    backgroundColor: "#111827",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
