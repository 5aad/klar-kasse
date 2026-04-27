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
import { OCR_GERMAN, useOCR } from "react-native-executorch";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";
function parseReceipt(lines: string[]) {
  const clean = (s: string) =>
    s
      .replace(/_/g, " ")
      .replace(/[ỊĪ]/g, "l")
      .replace(/[^\p{L}\p{N}\s.,€:/;-]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalized = lines.map(clean).filter(Boolean);
  const text = normalized.join(" ");

  const isPrice = (line: string) =>
    /^\d+[,.]\d{2}\s*€?$/.test(line) || /^€?\s*\d+[,.]\d{2}$/.test(line);

  const toNumber = (s: string) =>
    Number(s.replace("€", "").replace(",", "."));

  const isValidItemName = (line: string) =>
    !/^\d+$/.test(line) && // not just number
    !/^\d{5}\s+/.test(line) && // not postal code
    !/\b(gasse|straße|strasse|weg|platz)\b/i.test(line) && // not address
    !/^(norma|www|ust|einkaufswert|summe|artikel|gegeben|visa|mwst|netto|terminal|bnr|ta-nr|pan|karte|emv|vu-nr|genehmigung|datum|zahlung|bitte|trnr)/i.test(line);

  const items: any[] = [];

  for (let i = 1; i < normalized.length; i++) {
    const line = normalized[i];

    if (isPrice(line)) {
      const prev = normalized[i - 1];

      if (prev && isValidItemName(prev)) {
        items.push({
          name: prev,
          price: toNumber(line),
        });
      }
    }

    // handle weight items (kg + €/kg)
    if (/kg/i.test(line) && normalized[i + 1]?.includes("€/kg")) {
      const prev = normalized[i - 1];

      if (prev && isValidItemName(prev)) {
        items.push({
          name: prev,
          quantity: line.replace(",", "."),
          unit_price: normalized[i + 1]
            .replace(",", ".")
            .replace("€", "EUR"),
          price: null,
        });
      }
    }
  }

  const postalCity = text.match(/(\d{5})\s+([A-Za-zÄÖÜäöüß]+)/);
  const street =
    normalized.find(line =>
      /\b[A-Za-zÄÖÜäöüß]+(?:gasse|straße|strasse|weg|platz)\s*\d+\b/i.test(line)
    ) || null;

  const dateTime = text.match(
    /Datum\s+(\d{2})\.(\d{2})\.(\d{2})\s+(\d{1,2})[;:](\d{2})/i
  );

  const total = text.match(/EUR\s+(\d+[,.]\d{2})/i);

  return {
    store_name: normalized[0] || null,
    address: {
      street,
      postal_code: postalCity?.[1] || null,
      city: postalCity?.[2] || null,
      country: "Germany",
    },
    date: dateTime ? `20${dateTime[3]}-${dateTime[2]}-${dateTime[1]}` : null,
    time: dateTime
      ? `${dateTime[4].padStart(2, "0")}:${dateTime[5]}`
      : null,
    total_price: {
      amount: total ? toNumber(total[1]) : null,
      currency: "EUR",
    },
    payment_method: /visa kontaktlos/i.test(text)
      ? "Visa kontaktlos"
      : null,
    items,
  };
}
export default function CapturedReceiptScreen() {
  const [ocrText, setOcrText] = useState("");
  const croppedImage = useReceiptScanStore((state) => state.croppedImage);
  const clearReceiptImages = useReceiptScanStore(
    (state) => state.clearReceiptImages,
  );

  const { isReady, isGenerating, error, forward } = useOCR({
    model: OCR_GERMAN,
  });

  const retakeReceipt = () => {
    clearReceiptImages();
    router.back();
  };

  const runModel = async () => {
    if (!croppedImage?.uri || !isReady || isGenerating) return;

    try {
      const detections = await forward(croppedImage.uri);
      const text = detections.map((detection) => detection.text);

      // setOcrText(text);
      console.log("OCR Result:", text);
      console.log(parseReceipt(text));
    } catch (err) {
      console.error("OCR failed:", err);
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

      {error ? (
        <Text style={styles.errorText}>{String(error.message ?? error)}</Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={retakeReceipt}>
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryButton,
            (!isReady || isGenerating) && styles.disabledButton,
          ]}
          onPress={runModel}
          disabled={!isReady || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isReady ? "Read Receipt" : "Loading OCR..."}
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
      { contrast: 1.85 },
      { brightness: 1.18 },
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
