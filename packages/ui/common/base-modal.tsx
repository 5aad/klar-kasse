import { colors, radius, spacing } from "@repo/theme";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type BaseModalProps = {
  backdropStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAware?: boolean;
  onRequestClose: () => void;
  visible: boolean;
};

export function BaseModal({
  backdropStyle,
  children,
  contentStyle,
  keyboardAware = false,
  onRequestClose,
  visible,
}: BaseModalProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
        />
        {keyboardAware ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "position" : undefined}
            pointerEvents="box-none"
            style={styles.keyboardAvoider}
          >
            <ScrollView
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={styles.keyboardContent}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(16, 16, 16, 0.46)",
  },
  content: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
    boxShadow: "0 24px 44px rgba(16, 16, 16, 0.22)",
  },
  keyboardAvoider: {
    width: "100%",
  },
  keyboardContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
