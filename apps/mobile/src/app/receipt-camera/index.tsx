import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useReceiptScanStore } from '@/stores/receipt-scan-store';

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
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraSize, setCameraSize] = useState<Size | null>(null);
  const setReceiptImages = useReceiptScanStore((state) => state.setReceiptImages);

  const frame = cameraSize ? getReceiptFrame(cameraSize) : null;

  const handleCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraSize({ width, height });
  };

  const captureReceipt = async () => {
    if (!cameraRef.current || !cameraSize || !frame || isCapturing) {
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
      router.push('/receipt-camera/captured');
    } catch {
      setErrorMessage('Could not capture the receipt. Try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.body}>Allow camera access to scan receipts.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.cameraWrap} onLayout={handleCameraLayout}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          flash="on"
        />
        {frame ? (
          <View pointerEvents="none" style={styles.overlay}>
            <View style={[styles.dim, styles.topDim, { height: frame.y }]} />
            <View style={[styles.dim, styles.bottomDim, { top: frame.y + frame.height }]} />
            <View style={[styles.dim, styles.leftDim, { top: frame.y, width: frame.x, height: frame.height }]} />
            <View style={[styles.dim, styles.rightDim, { top: frame.y, left: frame.x + frame.width, height: frame.height }]} />
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
          <Text style={styles.instructionText}>Place the receipt inside the frame</Text>
        </View>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable style={[styles.captureButton, isCapturing && styles.disabled]} disabled={isCapturing} onPress={captureReceipt}>
        <View style={styles.captureButtonInner} />
      </Pressable>
    </View>
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

function getImageCropRect(picture: CameraCapturedPicture, previewSize: Size, frame: Rect): Rect {
  const scale = Math.max(previewSize.width / picture.width, previewSize.height / picture.height);
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

  return {
    x: Math.max(0, Math.min(crop.x, picture.width - 1)),
    y: Math.max(0, Math.min(crop.y, picture.height - 1)),
    width: Math.min(crop.width, picture.width - crop.x),
    height: Math.min(crop.height, picture.height - crop.y),
  };
}

async function cropReceiptFrame(picture: CameraCapturedPicture, previewSize: Size, frame: Rect) {
  const crop = getImageCropRect(picture, previewSize, frame);
  const image = await ImageManipulator.manipulate(picture.uri)
    .crop({
      originX: crop.x,
      originY: crop.y,
      width: crop.width,
      height: crop.height,
    })
    .resize({ width: OUTPUT_WIDTH })
    .renderAsync();

  return image.saveAsync({
    compress: 0.92,
    format: SaveFormat.JPEG,
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  permissionScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '700',
  },
  body: {
    marginTop: 12,
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  cameraWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
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
    position: 'absolute',
    borderColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 2,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderBottomRightRadius: 18,
  },
  instructions: {
    position: 'absolute',
    top: 52,
    right: 20,
    left: 20,
    alignItems: 'center',
  },
  instructionText: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    paddingHorizontal: 20,
    paddingTop: 12,
    color: '#fecaca',
    textAlign: 'center',
  },
  captureButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    marginVertical: 22,
    borderColor: '#ffffff',
    borderRadius: 38,
    borderWidth: 4,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  disabled: {
    opacity: 0.55,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
