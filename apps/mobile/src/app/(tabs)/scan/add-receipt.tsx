import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize, radius, spacing } from "@repo/theme";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/shared/screen-header";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useCategoriesQuery } from "@/queries/categories";
import { usePostReceiptMutation } from "@/queries/receipts";
import { getTabScreenBottomPadding } from "@/utils/tab-screen-spacing";

type ManualItem = {
  id: string;
  name: string;
  price: string;
};

const paymentMethods = ["Cash", "Visa", "Mastercard", "Debit"] as const;

function createItem(): ManualItem {
  return {
    id: String(Date.now() + Math.random()),
    name: "",
    price: "",
  };
}

function parseAmount(value: string) {
  return Number(value.replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}

export default function AddReceiptScreen() {
  const themeColors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const categoriesQuery = useCategoriesQuery();
  const postReceiptMutation = usePostReceiptMutation();
  const [store, setStore] = useState("");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("de-DE"));
  const [time, setTime] = useState("");
  const [total, setTotal] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number]>("Visa");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<ManualItem[]>([createItem()]);
  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + parseAmount(item.price), 0),
    [items],
  );
  const displayedTotal = total || itemsTotal.toFixed(2);
  const categoryOptions =
    categoriesQuery.data?.map((categoryItem) => categoryItem.name) ?? [];

  const updateItem = (
    id: string,
    field: keyof Pick<ManualItem, "name" | "price">,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((currentItems) =>
      currentItems.length === 1
        ? [{ ...currentItems[0], name: "", price: "" }]
        : currentItems.filter((item) => item.id !== id),
    );
  };

  const saveManualReceipt = () => {
    const receiptItems = items
      .filter((item) => item.name.trim() || item.price.trim())
      .map((item) => ({
        name: item.name.trim(),
        price: parseAmount(item.price),
        vatCode: "A",
      }));
    const receiptJson = {
      items: receiptItems,
      rawText: "",
      store: store.trim(),
      address: [],
      date,
      time,
      total: parseAmount(displayedTotal),
      paymentMethod,
      cardLast4: "",
      vat: [],
      itemCount: receiptItems.length,
      category,
    };

    postReceiptMutation.mutate(receiptJson, {
      onSuccess: () => router.replace("/(tabs)/scan"),
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getTabScreenBottomPadding(bottom, 42) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Add Manually"
          subtitle="Enter the main receipt details first, then add items."
        />

        <View style={styles.quickGrid}>
          <ManualField
            label="MERCHANT"
            placeholder="e.g. LIDL"
            value={store}
            onChangeText={setStore}
          />
          <View style={styles.twoColumnRow}>
            <ManualField
              compact
              label="DATE"
              placeholder="07.05.2026"
              value={date}
              onChangeText={setDate}
            />
            <ManualField
              compact
              label="TIME"
              placeholder="18:31"
              value={time}
              onChangeText={setTime}
            />
          </View>
          <ManualField
            label="TOTAL"
            keyboardType="decimal-pad"
            placeholder="0.00"
            value={displayedTotal}
            onChangeText={setTotal}
          />
        </View>

        <ChoiceGroup
          label="CATEGORY"
          emptyText="Add categories from the Budget screen first."
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />

        <ChoiceGroup
          label="PAYMENT"
          options={paymentMethods}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Items
          </Text>
          <Pressable
            style={[styles.smallAction, { backgroundColor: themeColors.text }]}
            onPress={() => setItems((currentItems) => [...currentItems, createItem()])}
          >
            <MaterialCommunityIcons
              color={themeColors.background}
              name="plus"
              size={18}
            />
            <Text
              style={[styles.smallActionText, { color: themeColors.background }]}
            >
              Add item
            </Text>
          </Pressable>
        </View>

        <View style={styles.itemList}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: themeColors.surface }]}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemNumber, { color: themeColors.primary }]}>
                  ITEM {index + 1}
                </Text>
                <Pressable onPress={() => removeItem(item.id)}>
                  <MaterialCommunityIcons
                    color={themeColors.mutedText}
                    name="trash-can-outline"
                    size={21}
                  />
                </Pressable>
              </View>
              <View style={styles.itemFields}>
                <TextInput
                  value={item.name}
                  onChangeText={(value) => updateItem(item.id, "name", value)}
                  placeholder="Item name"
                  placeholderTextColor={themeColors.mutedText}
                  style={[styles.itemNameInput, { color: themeColors.text }]}
                />
                <TextInput
                  value={item.price}
                  onChangeText={(value) => updateItem(item.id, "price", value)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={themeColors.mutedText}
                  style={[
                    styles.itemPriceInput,
                    {
                      borderColor: themeColors.text,
                      color: themeColors.text,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
          disabled={postReceiptMutation.isPending}
          onPress={saveManualReceipt}
        >
          <MaterialCommunityIcons
            color={themeColors.primaryText}
            name={postReceiptMutation.isPending ? "timer-sand" : "check-circle"}
            size={20}
          />
          <Text style={[styles.saveText, { color: themeColors.primaryText }]}>
            {postReceiptMutation.isPending ? "Saving..." : "Save Receipt"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ManualField({
  compact,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  compact?: boolean;
  keyboardType?: "default" | "decimal-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const themeColors = useThemeColors();

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: themeColors.surface },
        compact && styles.compactField,
      ]}
    >
      <Text style={[styles.fieldLabel, { color: themeColors.mutedText }]}>
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.mutedText}
        style={[styles.fieldInput, { color: themeColors.text }]}
      />
    </View>
  );
}

function ChoiceGroup<TValue extends string>({
  emptyText,
  label,
  onChange,
  options,
  value,
}: {
  emptyText?: string;
  label: string;
  onChange: (value: TValue) => void;
  options: readonly TValue[];
  value: TValue;
}) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.choiceLabel, { color: themeColors.text }]}>
        {label}
      </Text>
      <View style={styles.choiceList}>
        {options.length ? (
          options.map((option) => {
          const isSelected = option === value;

          return (
            <Pressable
              key={option}
              style={[
                styles.choiceChip,
                {
                  backgroundColor: isSelected
                    ? themeColors.primary
                    : themeColors.surface,
                },
              ]}
              onPress={() => onChange(option)}
            >
              <Text
                style={[
                  styles.choiceText,
                  {
                    color: isSelected
                      ? themeColors.primaryText
                      : themeColors.text,
                  },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
          })
        ) : (
          <Text style={[styles.choiceEmptyText, { color: themeColors.mutedText }]}>
            {emptyText ?? "No options available."}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  quickGrid: {
    gap: spacing.md,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    minHeight: 74,
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compactField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  fieldInput: {
    padding: 0,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  choiceSection: {
    gap: spacing.sm,
  },
  choiceLabel: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  choiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  choiceText: {
    fontSize: fontSize.sm,
    fontWeight: "800",
  },
  choiceEmptyText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  smallAction: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  smallActionText: {
    fontSize: fontSize.sm,
    fontWeight: "800",
  },
  itemList: {
    gap: spacing.md,
  },
  itemCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemNumber: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  itemFields: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemNameInput: {
    flex: 1,
    padding: 0,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  itemPriceInput: {
    width: 94,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: "800",
    textAlign: "right",
  },
  saveButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  saveText: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
});
