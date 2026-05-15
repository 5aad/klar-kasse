import { useCallback, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useTabBarStore } from "@/stores/tab-bar-store";

const MINIMIZE_OFFSET = 72;
const SCROLL_DELTA = 10;

export function useMinimizeTabBarOnScroll() {
  const lastOffsetYRef = useRef(0);
  const setIsMinimized = useTabBarStore((state) => state.setIsMinimized);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = Math.max(event.nativeEvent.contentOffset.y, 0);
      const deltaY = offsetY - lastOffsetYRef.current;

      if (offsetY < MINIMIZE_OFFSET) {
        setIsMinimized(false);
      } else if (deltaY > SCROLL_DELTA) {
        setIsMinimized(true);
      } else if (deltaY < -SCROLL_DELTA) {
        setIsMinimized(false);
      }

      lastOffsetYRef.current = offsetY;
    },
    [setIsMinimized],
  );

  return {
    onScroll,
    scrollEventThrottle: 16,
  };
}
