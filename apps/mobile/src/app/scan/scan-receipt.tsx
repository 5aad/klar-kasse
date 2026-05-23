import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { fontSize, radius, spacing } from "@repo/theme";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  View,
  type TurboModule,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";

const OUTPUT_WIDTH = 1200;
const RESPONSE_TYPE_IMAGE_FILE_PATH = "imageFilePath";
const SCAN_STATUS_CANCEL = "cancel";

type ScanDocumentOptions = {
  croppedImageQuality?: number;
  maxNumDocuments?: number;
  responseType?: typeof RESPONSE_TYPE_IMAGE_FILE_PATH;
};

type ScanDocumentResponse = {
  scannedImages?: string[];
  status?: "success" | typeof SCAN_STATUS_CANCEL;
};

type NativeDocumentScannerModule = TurboModule & {
  scanDocument(options: ScanDocumentOptions): Promise<ScanDocumentResponse>;
};

const documentScanner =
  TurboModuleRegistry.get<NativeDocumentScannerModule>("DocumentScanner");

export default function ScanReceiptScreen() {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setReceiptImages = useReceiptScanStore(
    (state) => state.setReceiptImages,
  );

  const scanReceipt = useCallback(async () => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      if (!documentScanner) {
        setErrorMessage(t("scan.camera.errors.nativeUnavailable"));
        return;
      }

      const result = await documentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 1,
        responseType: RESPONSE_TYPE_IMAGE_FILE_PATH,
      });

      if (result.status === SCAN_STATUS_CANCEL) {
        router.back();
        return;
      }

      const scannedUri = result.scannedImages?.[0];

      if (!scannedUri) {
        setErrorMessage(t("scan.camera.errors.noScan"));
        return;
      }

      const normalized = await normalizeReceiptImage(scannedUri);

      setReceiptImages({
        originalImage: {
          uri: normalizeImageUri(scannedUri),
          width: normalized.width,
          height: normalized.height,
        },
        croppedImage: {
          uri: normalized.uri,
          width: normalized.width,
          height: normalized.height,
        },
      });
      router.push("/scan/receipt-preview");
    } catch (error) {
      console.error("Document scanner failed:", error);
      setErrorMessage(
        t("scan.camera.errors.capture", {
          message:
            error instanceof Error
              ? error.message
              : t("scan.camera.errors.tryAgain"),
        }),
      );
    } finally {
      setIsScanning(false);
    }
  }, [setReceiptImages, t]);

  useFocusEffect(
    useCallback(() => {
      void scanReceipt();
    }, [scanReceipt]),
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.content,
          {
            alignSelf: "center",
            maxWidth: adaptive.maxFormWidth,
            paddingHorizontal: adaptive.gutter,
            width: "100%",
          },
        ]}
      >
        {isScanning ? (
          <ActivityIndicator color={themeColors.primary} />
        ) : (
          <MaterialCommunityIcons
            color={themeColors.primary}
            name="camera-outline"
            size={34}
          />
        )}

        {errorMessage ? (
          <>
            <Text style={[styles.error, { color: themeColors.text }]}>
              {errorMessage}
            </Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={scanReceipt}
                style={[
                  styles.button,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeColors.primaryText },
                  ]}
                >
                  {t("scan.camera.errors.tryAgain")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={[
                  styles.button,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: themeColors.text }]}>
                  {t("scan.camera.permission.settingsAction")}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

async function normalizeReceiptImage(uri: string) {
  return manipulateAsync(
    normalizeImageUri(uri),
    [{ resize: { width: OUTPUT_WIDTH } }],
    {
      compress: 0.92,
      format: SaveFormat.JPEG,
    },
  );
}

function normalizeImageUri(uri: string) {
  if (/^(file|content|asset|data):/i.test(uri)) {
    return uri;
  }

  return `file://${uri}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  error: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
