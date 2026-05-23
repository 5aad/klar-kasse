import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type WindowSizeClass = "compact" | "medium" | "expanded";

export function useAdaptiveLayout() {
  const { fontScale, height, width } = useWindowDimensions();
  const shortestSide = Math.min(width, height);

  return useMemo(() => {
    const sizeClass: WindowSizeClass =
      width >= 840 ? "expanded" : width >= 600 ? "medium" : "compact";
    const isMedium = sizeClass !== "compact";
    const isExpanded = sizeClass === "expanded";
    const isTablet = shortestSide >= 600 || width >= 600;

    return {
      fontScale,
      height,
      width,
      gutter: isExpanded ? 32 : isMedium ? 24 : 18,
      isExpanded,
      isMedium,
      isTablet,
      maxContentWidth: isExpanded ? 1180 : isMedium ? 920 : undefined,
      maxFormWidth: isExpanded ? 760 : isMedium ? 680 : undefined,
      sizeClass,
    };
  }, [fontScale, height, shortestSide, width]);
}
