import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";

const doodles = [
  "face-man-profile",
  "face-woman-profile",
  "emoticon-cool-outline",
  "emoticon-happy-outline",
  "robot-happy-outline",
  "account-star-outline",
] as const;

const themeOptions = [
  { key: "light", label: "Light", icon: "white-balance-sunny" },
  { key: "dark", label: "Dark", icon: "moon-waning-crescent" },
  { key: "system", label: "System", icon: "cellphone-cog" },
] as const;

export default function PreferencesScreen() {
  const { width } = useWindowDimensions();
  const [name, setName] = useState("Tom Hillson");
  const [selectedDoodle, setSelectedDoodle] = useState(0);
  const [selectedTheme, setSelectedTheme] =
    useState<(typeof themeOptions)[number]["key"]>("system");
  const doodleTileSize = (width - spacing.lg * 2 - spacing.md * 2) / 3;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Preferences"
          subtitle="Update your profile and display settings."
        />

        <View style={styles.section}>
          <Text style={styles.label}>DISPLAY NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PROFILE DOODLE</Text>
          <View style={styles.doodleGrid}>
            {doodles.map((doodle, index) => (
              <Pressable
                key={doodle}
                style={[
                  styles.doodleTile,
                  {
                    width: doodleTileSize,
                    height: doodleTileSize,
                    borderRadius: doodleTileSize / 2,
                  },
                  selectedDoodle === index && styles.selectedTile,
                ]}
                onPress={() => setSelectedDoodle(index)}
              >
                <MaterialCommunityIcons
                  color={
                    selectedDoodle === index ? colors.primaryText : colors.text
                  }
                  name={doodle}
                  size={54}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>APP THEME</Text>
          <View style={styles.themeList}>
            {themeOptions.map((option) => {
              const isSelected = selectedTheme === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.themeOption,
                    isSelected && styles.themeOptionSelected,
                  ]}
                  onPress={() => setSelectedTheme(option.key)}
                >
                  <MaterialCommunityIcons
                    color={isSelected ? colors.primary : colors.text}
                    name={option.icon}
                    size={25}
                  />
                  <Text
                    style={[
                      styles.themeText,
                      isSelected && styles.themeTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <MaterialCommunityIcons
                    color={isSelected ? colors.primary : colors.mutedText}
                    name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                    size={24}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  section: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
    backgroundColor: colors.surface,
  },
  doodleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  doodleTile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  selectedTile: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  themeList: {
    gap: spacing.md,
  },
  themeOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
  },
  themeText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  themeTextSelected: {
    color: colors.primary,
  },
});
