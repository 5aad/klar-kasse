import { colors, fontSize, radius, spacing } from "@repo/theme";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useAdaptiveLayout } from "@/hooks/use-adaptive-layout";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  legalDocuments,
  type LegalDocument,
  type LegalDocumentSection,
} from "@/utils/legal-documents";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type Props = {
  documentKey: keyof typeof legalDocuments;
  subtitle: string;
  title: string;
};

function getLocalizedDocument(
  documentKey: keyof typeof legalDocuments,
  language: string,
): LegalDocument {
  return legalDocuments[documentKey][language.startsWith("de") ? "de" : "en"];
}

export function LegalDocumentScreen({ documentKey, subtitle, title }: Props) {
  const themeColors = useThemeColors();
  const adaptive = useAdaptiveLayout();
  const { bottom } = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const document = getLocalizedDocument(documentKey, i18n.language);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            alignSelf: "center",
            maxWidth: adaptive.maxFormWidth,
            paddingBottom: getTabScreenBottomPadding(bottom, 36),
            paddingHorizontal: adaptive.gutter,
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} subtitle={subtitle} />
        <Text style={[styles.effectiveDate, { color: themeColors.mutedText }]}>
          {document.effectiveDate}
        </Text>

        <View style={styles.sections}>
          {document.sections.map((section) => (
            <LegalSection
              key={section.title}
              section={section}
              surfaceColor={themeColors.surface}
              textColor={themeColors.text}
              mutedTextColor={themeColors.mutedText}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type LegalSectionProps = {
  mutedTextColor: string;
  section: LegalDocumentSection;
  surfaceColor: string;
  textColor: string;
};

function LegalSection({
  mutedTextColor,
  section,
  surfaceColor,
  textColor,
}: LegalSectionProps) {
  return (
    <View style={[styles.section, { backgroundColor: surfaceColor }]}>
      <Text selectable style={[styles.sectionTitle, { color: textColor }]}>
        {section.title}
      </Text>
      {section.body.map((paragraph) => (
        <Text
          selectable
          key={paragraph}
          style={[styles.paragraph, { color: mutedTextColor }]}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  effectiveDate: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  sections: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  paragraph: {
    fontSize: fontSize.md,
    fontWeight: "500",
    lineHeight: 21,
  },
});
