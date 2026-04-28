import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  type GestureResponderEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditBudgetScreen() {
  const params = useLocalSearchParams<{
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    limit?: string;
    name?: string;
    spent?: string;
    type?: string;
  }>();
  const name = params.name ?? "Groceries";
  const type = params.type ?? "Monthly household supply";
  const icon = params.icon ?? "cart";
  const spent = Number(params.spent ?? 428.5);
  const limit = Number(params.limit ?? 600);
  const [limitValue, setLimitValue] = useState(limit.toFixed(2));
  const [proportion, setProportion] = useState(0.58);
  const sliderWidthRef = useRef(1);
  const dragStartProportionRef = useRef(0.58);
  const proportionPercent = Math.round(proportion * 100);

  const clampProportion = (value: number) => Math.max(0, Math.min(1, value));

  const updateProportionFromLocation = (event: GestureResponderEvent) => {
    setProportion(
      clampProportion(
        event.nativeEvent.locationX / Math.max(sliderWidthRef.current, 1),
      ),
    );
  };

  const sliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dragStartProportionRef.current = proportion;
          updateProportionFromLocation(event);
        },
        onPanResponderMove: (_, gestureState) => {
          setProportion(
            clampProportion(
              dragStartProportionRef.current +
                gestureState.dx / Math.max(sliderWidthRef.current, 1),
            ),
          );
        },
      }),
    [proportion],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.currentCard}>
          <View style={styles.currentAccent} />
          <View style={styles.currentHeader}>
            <View style={styles.currentCopy}>
              <Text style={styles.eyebrow}>CURRENT ALLOCATION</Text>
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.subtitle}>{formatType(type)}</Text>
            </View>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                color={colors.primary}
                name={icon}
                size={34}
              />
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>USED</Text>
              <Text style={styles.statValue}>${spent.toFixed(2)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CURRENT LIMIT</Text>
              <Text style={styles.statValue}>${limit.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NEW MONTHLY LIMIT</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.amountInput}
            value={`$${limitValue}`}
            onChangeText={(value) =>
              setLimitValue(value.replace(/[^\d.]/g, ""))
            }
          />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              color={colors.mutedText}
              name="information"
              size={16}
            />
            <Text style={styles.infoText}>
              This limit will apply to the current billing cycle.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.proportionHeader}>
            <Text style={styles.sectionLabel}>ADJUST PROPORTION</Text>
            <Text style={styles.proportionText}>
              {proportionPercent}% of total income
            </Text>
          </View>

          <Pressable
            style={styles.sliderTrack}
            onLayout={(event) => {
              sliderWidthRef.current = event.nativeEvent.layout.width;
            }}
            onPress={updateProportionFromLocation}
            {...sliderPanResponder.panHandlers}
          >
            <View
              style={[styles.sliderFill, { width: `${proportion * 100}%` }]}
            />
            <View
              style={[styles.sliderThumb, { left: `${proportion * 100}%` }]}
            />
          </Pressable>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$100</Text>
            <Text style={styles.sliderLabel}>$1,200</Text>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            color={colors.primaryText}
            name="content-save-outline"
            size={20}
          />
          <Text style={styles.saveText}>Save Changes</Text>
        </Pressable>

        <Pressable style={styles.discardButton} onPress={() => router.back()}>
          <Text style={styles.discardText}>Discard Edits</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatType(type: string) {
  return type.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 42,
  },
  currentCard: {
    overflow: "hidden",
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    boxShadow: "0 12px 0 rgba(16, 16, 16, 0.16)",
  },
  currentAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
    backgroundColor: colors.primary,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  currentCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  iconBox: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "#E63C3A26",
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "900",
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: fontSize.sm,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  amountInput: {
    minHeight: 98,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
    backgroundColor: colors.surface,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.mutedText,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  proportionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  proportionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "900",
  },
  sliderTrack: {
    height: 14,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.mutedText,
  },
  sliderFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.text,
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: radius.sm,
    borderWidth: 4,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    color: colors.mutedText,
    fontSize: fontSize.xs,
    fontWeight: "900",
  },
  saveButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    boxShadow: "0 6px 12px rgba(230, 60, 58, 0.22)",
  },
  saveText: {
    color: colors.primaryText,
    fontSize: fontSize.lg,
    fontWeight: "900",
  },
  discardButton: {
    alignItems: "center",
  },
  discardText: {
    color: colors.mutedText,
    fontSize: fontSize.md,
    fontWeight: "900",
  },
});
