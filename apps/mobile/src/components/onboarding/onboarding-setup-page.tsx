import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fontSize, radius, spacing } from "@repo/theme";
import { memo } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { AvatarCarousel } from "@/components/settings/avatar-carousel";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { avatarImageUrls } from "@/utils/avatar-images";

type Props = {
  budget: string;
  downloadedAvatarUrls: string[];
  downloadingAvatarUrl: string | null;
  name: string;
  previewRefreshKey: number;
  profileImageUri: string | null;
  onBudgetChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSelectAvatar: (url: string) => void;
};

function OnboardingSetupPage({
  budget,
  downloadedAvatarUrls,
  downloadingAvatarUrl,
  name,
  previewRefreshKey,
  profileImageUri,
  onBudgetChange,
  onNameChange,
  onSelectAvatar,
}: Props) {
  const { width } = useWindowDimensions();
  const adaptive = useAdaptiveLayout();
  const themeColors = useThemeColors();

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.page, { width }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          adaptive.isMedium && styles.scrollContentWide,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.setupContent,
            adaptive.isMedium && styles.setupContentWide,
            { maxWidth: adaptive.isMedium ? 900 : 420 },
          ]}
        >
          <View style={[styles.copy, adaptive.isMedium && styles.copyWide]}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${themeColors.primary}18` },
              ]}
            >
              <MaterialCommunityIcons
                color={themeColors.primary}
                name="account-heart-outline"
                size={38}
              />
            </View>
            <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
              Setup
            </Text>
            <Text
              style={[
                styles.title,
                adaptive.isMedium && styles.titleWide,
                { color: themeColors.text },
              ]}
            >
              Make Klar Kasse yours.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={onNameChange}
                placeholder="Your name"
                placeholderTextColor={themeColors.mutedText}
                returnKeyType="next"
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.text,
                    color: themeColors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Monthly budget
              </Text>
              <TextInput
                value={budget}
                onChangeText={onBudgetChange}
                placeholder="0.00"
                placeholderTextColor={themeColors.mutedText}
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.text,
                    color: themeColors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Profile image
              </Text>
              <AvatarCarousel
                avatarUrls={avatarImageUrls}
                downloadedAvatarUrls={downloadedAvatarUrls}
                downloadingAvatarUrl={downloadingAvatarUrl}
                previewRefreshKey={previewRefreshKey}
                profileImageUri={profileImageUri}
                onSelectAvatar={onSelectAvatar}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default memo(OnboardingSetupPage);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 36,
    paddingBottom: 28,
  },
  scrollContentWide: {
    justifyContent: "center",
  },
  setupContent: {
    alignSelf: "center",
    width: "100%",
    gap: spacing.lg,
  },
  setupContentWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 48,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  copyWide: {
    flex: 0.8,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    maxWidth: 320,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  titleWide: {
    textAlign: "left",
  },
  form: {
    flex: 1,
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
});
