import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.profile}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: PROFILE_IMAGE }} style={styles.avatar} />
        </View>
        <Text style={styles.name}>Tom Hillson</Text>
        {/* <Text style={styles.email}>Tomhill@mail.com</Text> */}
      </View>

      <View style={styles.menu}>
        <SettingsRow icon="cog-outline" label="Preferences" />
        <SettingsRow icon="database-outline" label="Your Data" />
        <SettingsRow icon="translate" label="Language" />
        <SettingsRow icon="help-circle-outline" label="Customer Support" />
      </View>
    </SafeAreaView>
  );
}

type SettingsRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  showChevron?: boolean;
};

function SettingsRow({ icon, label, showChevron = true }: SettingsRowProps) {
  return (
    <Pressable style={styles.row}>
      <MaterialCommunityIcons name={icon} size={30} color={colors.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      {showChevron ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={25}
          color={colors.mutedText}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  profile: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: 44,
  },
  avatarWrap: {
    width: 108,
    height: 108,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 54,
    backgroundColor: colors.surface,
  },
  name: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  email: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  menu: {
    gap: spacing.lg,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
});
