import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from "expo-camera";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import { fontSize, radius, spacing } from "@repo/theme";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAndroidBackToHome } from "@/hooks/use-android-back-to-home";
import { useReceiptScanStore } from "@/stores/receipt-scan-store";

const FRAME_WIDTH_RATIO = 0.74;
const FRAME_ASPECT_RATIO = 0.44;
const FRAME_MAX_HEIGHT_RATIO = 1;
const OUTPUT_WIDTH = 1200;

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

export default function ReceiptCameraScreen() {
  const themeColors = useThemeColors();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraSize, setCameraSize] = useState<Size | null>(null);
  const setReceiptImages = useReceiptScanStore(
    (state) => state.setReceiptImages,
  );
  useAndroidBackToHome("/(dashboard)");
  const frame = cameraSize ? getReceiptFrame(cameraSize) : null;
  const goToDashboard = () => {
    router.replace("/(dashboard)");
  };

  const handleCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraSize({ width, height });
  };

  const captureReceipt = async () => {
    if (!isFocused || !cameraRef.current || !cameraSize || !frame || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      const cropped = await cropReceiptFrame(picture, cameraSize, frame);

      setReceiptImages({
        originalImage: {
          uri: picture.uri,
          width: picture.width,
          height: picture.height,
        },
        croppedImage: {
          uri: cropped.uri,
          width: cropped.width,
          height: cropped.height,
        },
      });
      router.push("/receipt-camera/captured");
    } catch (error) {
      console.error("Receipt capture failed:", error);
      setErrorMessage(
        `Could not capture the receipt. ${
          error instanceof Error ? error.message : "Try again."
        }`,
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const pickReceiptFromGallery = async () => {
    if (isCapturing || isPickingImage) {
      return;
    }

    setIsPickingImage(true);
    setErrorMessage(null);

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorMessage("Allow photo library access to choose a receipt.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const normalized = await normalizePickedReceipt(asset);

      setReceiptImages({
        originalImage: {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        },
        croppedImage: {
          uri: normalized.uri,
          width: normalized.width,
          height: normalized.height,
        },
      });
      router.push("/receipt-camera/captured");
    } catch (error) {
      console.error("Gallery receipt pick failed:", error);
      setErrorMessage(
        `Could not open the receipt. ${
          error instanceof Error ? error.message : "Try again."
        }`,
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  if (!permission) {
    return (
      <View
        style={[styles.centered, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionScreen,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>
          Camera access
        </Text>
        <Text style={[styles.body, { color: themeColors.mutedText }]}>
          Allow camera access to scan receipts.
        </Text>
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={requestPermission}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: themeColors.primaryText },
            ]}
          >
            Allow camera
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Scan Receipt"
          subtitle="Place the receipt inside the frame."
          onBack={goToDashboard}
        />
      </View>

      <View style={styles.cameraWrap} onLayout={handleCameraLayout}>
        {isFocused ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash="on"
          />
        ) : (
          <View style={styles.camera} />
        )}
        {frame ? (
          <View pointerEvents="none" style={styles.overlay}>
            <View style={[styles.dim, styles.topDim, { height: frame.y }]} />
            <View
              style={[
                styles.dim,
                styles.bottomDim,
                { top: frame.y + frame.height },
              ]}
            />
            <View
              style={[
                styles.dim,
                styles.leftDim,
                { top: frame.y, width: frame.x, height: frame.height },
              ]}
            />
            <View
              style={[
                styles.dim,
                styles.rightDim,
                {
                  top: frame.y,
                  left: frame.x + frame.width,
                  height: frame.height,
                },
              ]}
            />
            <View
              style={[
                styles.receiptFrame,
                {
                  top: frame.y,
                  left: frame.x,
                  width: frame.width,
                  height: frame.height,
                },
              ]}
            >
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        ) : null}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Place the receipt inside the frame
          </Text>
        </View>
      </View>

      {errorMessage ? (
        <Text style={[styles.error, { color: themeColors.primary }]}>
          {errorMessage}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel="Choose receipt from gallery"
          accessibilityRole="button"
          style={[
            styles.galleryButton,
            { backgroundColor: themeColors.surface },
            (isCapturing || isPickingImage) && styles.disabled,
          ]}
          disabled={isCapturing || isPickingImage}
          onPress={pickReceiptFromGallery}
        >
          <MaterialCommunityIcons
            color={themeColors.text}
            name="image-outline"
            size={25}
          />
        </Pressable>

        <Pressable
          style={[
            styles.captureButton,
            (isCapturing || isPickingImage) && styles.disabled,
          ]}
          disabled={isCapturing || isPickingImage}
          onPress={captureReceipt}
        >
          <View
            style={[
              styles.captureButtonInner,
              { backgroundColor: themeColors.primaryText },
            ]}
          />
        </Pressable>

        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
}

function getReceiptFrame(size: Size): Rect {
  const maxWidth = size.width * FRAME_WIDTH_RATIO;
  const maxHeight = size.height * FRAME_MAX_HEIGHT_RATIO;
  const width = Math.min(maxWidth, maxHeight * FRAME_ASPECT_RATIO);
  const height = width / FRAME_ASPECT_RATIO;

  return {
    x: (size.width - width) / 2,
    y: (size.height - height) / 2,
    width,
    height,
  };
}

function getImageCropRect(picture: Size, previewSize: Size, frame: Rect): Rect {
  const scale = Math.max(
    previewSize.width / picture.width,
    previewSize.height / picture.height,
  );
  const displayedWidth = picture.width * scale;
  const displayedHeight = picture.height * scale;
  const offsetX = (displayedWidth - previewSize.width) / 2;
  const offsetY = (displayedHeight - previewSize.height) / 2;

  const crop = {
    x: (frame.x + offsetX) / scale,
    y: (frame.y + offsetY) / scale,
    width: frame.width / scale,
    height: frame.height / scale,
  };
  const x = Math.max(0, Math.min(crop.x, picture.width - 1));
  const y = Math.max(0, Math.min(crop.y, picture.height - 1));

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.max(1, Math.min(crop.width, picture.width - x))),
    height: Math.round(Math.max(1, Math.min(crop.height, picture.height - y))),
  };
}

async function cropReceiptFrame(
  picture: CameraCapturedPicture,
  previewSize: Size,
  frame: Rect,
) {
  const normalized = await manipulateAsync(picture.uri, [{ rotate: 0 }], {
    compress: 1,
    format: SaveFormat.JPEG,
  });
  const crop = getImageCropRect(normalized, previewSize, frame);

  return manipulateAsync(
    normalized.uri,
    [
      {
        crop: {
          originX: crop.x,
          originY: crop.y,
          width: crop.width,
          height: crop.height,
        },
      },
      { resize: { width: OUTPUT_WIDTH } },
    ],
    {
      compress: 0.92,
      format: SaveFormat.JPEG,
    },
  );
}

async function normalizePickedReceipt(asset: ImagePicker.ImagePickerAsset) {
  return manipulateAsync(
    asset.uri,
    [{ resize: { width: Math.min(asset.width || OUTPUT_WIDTH, OUTPUT_WIDTH) } }],
    {
      compress: 0.92,
      format: SaveFormat.JPEG,
    },
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionScreen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  body: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    lineHeight: 24,
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cameraWrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(16, 16, 16, 0.64)",
  },
  topDim: {
    top: 0,
    right: 0,
    left: 0,
  },
  bottomDim: {
    right: 0,
    bottom: 0,
    left: 0,
  },
  leftDim: {
    left: 0,
  },
  rightDim: {
    right: 0,
  },
  receiptFrame: {
    position: "absolute",
    borderColor: "#ffffff",
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#E63C3A",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: radius.lg,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: radius.lg,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: radius.lg,
  },
  bottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderBottomRightRadius: radius.lg,
  },
  instructions: {
    position: "absolute",
    top: 52,
    right: 20,
    left: 20,
    alignItems: "center",
  },
  instructionText: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(16, 16, 16, 0.78)",
    color: "#ffffff",
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  error: {
    paddingHorizontal: 20,
    paddingTop: 12,
    textAlign: "center",
  },
  footer: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  galleryButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  captureButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderColor: "#ffffff",
    borderRadius: 32,
    borderWidth: 4,
  },
  captureButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  footerSpacer: {
    width: 48,
    height: 48,
  },
  disabled: {
    opacity: 0.55,
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
