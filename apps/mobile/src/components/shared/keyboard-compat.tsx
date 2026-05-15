import React from "react";
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

import { useMinimizeTabBarOnScroll } from "@/hooks/use-minimize-tab-bar-on-scroll";

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function KeyboardAwareScrollView({
  children,
  onScroll,
  scrollEventThrottle,
  ...props
}: ScrollViewProps & { children?: React.ReactNode }) {
  const tabBarScrollProps = useMinimizeTabBarOnScroll();

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    tabBarScrollProps.onScroll(event);
    onScroll?.(event);
  }

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      onScroll={handleScroll}
      scrollEventThrottle={
        scrollEventThrottle ?? tabBarScrollProps.scrollEventThrottle
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
}
