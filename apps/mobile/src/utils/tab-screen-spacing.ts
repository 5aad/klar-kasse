import { Platform } from "react-native";

const ANDROID_NATIVE_TAB_BAR_CLEARANCE = 88;

export function getTabScreenBottomPadding(
  bottomInset: number,
  fallbackPadding: number,
) {
  if (Platform.OS !== "android") return fallbackPadding;

  return bottomInset + ANDROID_NATIVE_TAB_BAR_CLEARANCE;
}
