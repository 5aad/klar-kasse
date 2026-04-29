import { colors, radius, spacing } from "@repo/theme";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type BaseModalProps = {
  backdropStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onRequestClose: () => void;
  visible: boolean;
};

export function BaseModal({
  backdropStyle,
  children,
  contentStyle,
  onRequestClose,
  visible,
}: BaseModalProps) {
  return (
    <Modal
      animationType="fade"
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
        <View style={[styles.content, contentStyle]}>{children}</View>
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
});
