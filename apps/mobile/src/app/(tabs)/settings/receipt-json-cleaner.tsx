import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { KeyboardAwareScrollView } from "@/components/shared/keyboard-compat";
import {
  useReceiptJsonCleaner,
  type ReceiptJsonWithRawText,
} from "@/hooks/use-receipt-json-cleaner";
import { useThemeColors } from "@/hooks/use-theme-colors";

const EMPTY_RECEIPT_JSON = `{
  "cardLast4": "",
  "date": "",
  "itemCount": 0,
  "items": [],
  "paymentMethod": "",
  "rawText": "",
  "store": "",
  "total": 0,
  "vat": []
}`;

export default function ReceiptJsonCleanerTestScreen() {
  const themeColors = useThemeColors();
  const cleaner = useReceiptJsonCleaner();
  const [inputJson, setInputJson] = useState(EMPTY_RECEIPT_JSON);
  const [outputJson, setOutputJson] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusText = useMemo(() => {
    if (cleaner.isGenerating) return "Cleaning JSON...";
    if (!cleaner.isReady) {
      const progress = Math.round(cleaner.downloadProgress * 100);

      return progress > 0
        ? `Loading local model ${progress}%`
        : "Loading local model...";
    }

    return "Local cleaner ready";
  }, [cleaner.downloadProgress, cleaner.isGenerating, cleaner.isReady]);

  const cleanJson = async () => {
    setErrorMessage(null);
    setOutputJson("");

    let parsedJson: ReceiptJsonWithRawText;

    try {
      parsedJson = parseReceiptJsonInput(inputJson);
    } catch (error) {
      setErrorMessage(
        `Input is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    try {
      const result = await cleaner.cleanReceiptJson(parsedJson);

      setOutputJson(JSON.stringify(result.data, null, 2));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Receipt JSON Cleaner"
          subtitle="Paste parsed receipt JSON and run one local cleanup pass."
          onBack={() => router.back()}
        />

        <View
          style={[
            styles.statusPanel,
            { backgroundColor: themeColors.surface },
          ]}
        >
          {cleaner.isGenerating || !cleaner.isReady ? (
            <ActivityIndicator color={themeColors.primary} />
          ) : (
            <MaterialCommunityIcons
              color={themeColors.primary}
              name="check-circle-outline"
              size={22}
            />
          )}
          <Text style={[styles.statusText, { color: themeColors.text }]}>
            {statusText}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            INPUT JSON
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            value={inputJson}
            onChangeText={setInputJson}
            placeholder="Paste receipt parser JSON here"
            placeholderTextColor={themeColors.mutedText}
            style={[
              styles.jsonInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={cleaner.isGenerating || !cleaner.isReady}
          onPress={cleanJson}
          style={[
            styles.runButton,
            { backgroundColor: themeColors.primary },
            (cleaner.isGenerating || !cleaner.isReady) && styles.disabled,
          ]}
        >
          {cleaner.isGenerating ? (
            <ActivityIndicator color={themeColors.primaryText} />
          ) : (
            <MaterialCommunityIcons
              color={themeColors.primaryText}
              name="auto-fix"
              size={20}
            />
          )}
          <Text
            style={[styles.runButtonText, { color: themeColors.primaryText }]}
          >
            Run Cleaner
          </Text>
        </Pressable>

        {errorMessage ? (
          <Text style={[styles.errorText, { color: themeColors.primary }]}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            OUTPUT JSON
          </Text>
          <TextInput
            editable={false}
            multiline
            value={outputJson}
            placeholder="Cleaned JSON will appear here"
            placeholderTextColor={themeColors.mutedText}
            style={[
              styles.jsonInput,
              styles.outputInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function parseReceiptJsonInput(input: string): ReceiptJsonWithRawText {
  try {
    return JSON.parse(input) as ReceiptJsonWithRawText;
  } catch {
    return JSON.parse(
      escapeControlCharactersInJsonStrings(input),
    ) as ReceiptJsonWithRawText;
  }
}

function escapeControlCharactersInJsonStrings(input: string) {
  let output = "";
  let isInString = false;
  let isEscaped = false;

  for (const character of input) {
    if (isEscaped) {
      output += character;
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      output += character;
      isEscaped = isInString;
      continue;
    }

    if (character === '"') {
      output += character;
      isInString = !isInString;
      continue;
    }

    if (isInString) {
      if (character === "\n") {
        output += "\\n";
        continue;
      }

      if (character === "\r") {
        output += "\\r";
        continue;
      }

      if (character === "\t") {
        output += "\\t";
        continue;
      }
    }

    output += character;
  }

  return output;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  statusPanel: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  jsonInput: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  outputInput: {
    minHeight: 260,
  },
  runButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  runButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  errorText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    lineHeight: 21,
  },
  disabled: {
    opacity: 0.55,
  },
});
