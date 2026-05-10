import React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function KeyboardAwareScrollView({
  children,
  ...props
}: ScrollViewProps & { children?: React.ReactNode }) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}
