import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  categories,
  categoryBudgets,
  monthlyBudgets,
  receiptItems,
  receipts,
  receiptVat,
} from "@/db/schema";

const EXPORT_SCHEMA_VERSION = 1;
const EXPORT_MIME_TYPE = "text/csv";

function getMonthKeyFromDateText(dateText?: string | null) {
  if (!dateText) return null;

  const germanDate = dateText.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (germanDate) {
    const year =
      germanDate[3].length === 2 ? `20${germanDate[3]}` : germanDate[3];

    return `${year}-${germanDate[2]}`;
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getExportFileName(monthKey: string) {
  return `klar-kasse-${monthKey}.csv`;
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const text =
    value instanceof Date
      ? value.toISOString()
      : Array.isArray(value)
        ? value.join("; ")
        : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function createCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(formatCsvValue).join(","),
    ...rows.map((row) => row.map(formatCsvValue).join(",")),
  ].join("\n");
}

function parseAddress(value: string | null) {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed.filter(Boolean).join("; ") : "";
  } catch {
    return "";
  }
}

function buildMonthlyCsvExport(monthKey: string) {
  initializeDatabase();

  const monthlyBudget =
    db
      .select()
      .from(monthlyBudgets)
      .where(eq(monthlyBudgets.monthKey, monthKey))
      .get() ?? null;
  const activeMonthlyBudget =
    monthlyBudget && !monthlyBudget.deletedAt ? monthlyBudget : null;
  const receiptRows = db
    .select()
    .from(receipts)
    .where(isNull(receipts.deletedAt))
    .all()
    .filter((receipt) => {
      const receiptMonthKey =
        getMonthKeyFromDateText(receipt.dateText) ??
        getMonthKeyFromDateText(receipt.createdAt);

      return receiptMonthKey === monthKey;
    });
  const receiptIds = new Set(receiptRows.map((receipt) => receipt.id));
  const itemRows = db
    .select()
    .from(receiptItems)
    .where(isNull(receiptItems.deletedAt))
    .all()
    .filter((item) => receiptIds.has(item.receiptId));
  const vatRows = db
    .select()
    .from(receiptVat)
    .where(isNull(receiptVat.deletedAt))
    .all()
    .filter((vatLine) => receiptIds.has(vatLine.receiptId));
  const categoryBudgetRows = activeMonthlyBudget
    ? db
        .select()
        .from(categoryBudgets)
        .where(eq(categoryBudgets.monthlyBudgetId, activeMonthlyBudget.id))
        .all()
        .filter((categoryBudget) => !categoryBudget.deletedAt)
    : [];
  const categoryIds = new Set(
    [
      ...receiptRows.map((receipt) => receipt.categoryId),
      ...itemRows.map((item) => item.categoryId),
      ...categoryBudgetRows.map((categoryBudget) => categoryBudget.categoryId),
    ].filter((categoryId): categoryId is string => Boolean(categoryId)),
  );
  const categoryNames = new Set(
    receiptRows
      .map((receipt) => receipt.categoryName)
      .filter((categoryName): categoryName is string => Boolean(categoryName)),
  );
  const categoryRows = db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .all()
    .filter(
      (category) =>
        categoryIds.has(category.id) || categoryNames.has(category.name),
    );

  const categoryById = new Map(
    categoryRows.map((category) => [category.id, category]),
  );
  const budgetByCategoryId = new Map(
    categoryBudgetRows.map((categoryBudget) => [
      categoryBudget.categoryId,
      categoryBudget,
    ]),
  );
  const exportedAt = new Date().toISOString();
  const headers = [
    "schema_version",
    "exported_at",
    "month_key",
    "receipt_id",
    "receipt_date",
    "store",
    "address",
    "receipt_category",
    "category_limit",
    "receipt_total",
    "currency",
    "payment_method",
    "card_last4",
    "receipt_note",
    "receipt_image_uri",
    "items",
    "vat_summary",
  ];
  const rows = receiptRows.map((receipt) => {
    const itemsForReceipt = itemRows.filter(
      (item) => item.receiptId === receipt.id,
    );
    const itemSummary = itemsForReceipt
      .map((item) => {
        const quantity = item.quantity ? ` x ${item.quantity}` : "";
        const unitPrice = item.unitPrice ? ` @ ${item.unitPrice}` : "";

        return `${item.name}${quantity}${unitPrice}: ${item.price}`;
      })
      .join("; ");
    const vatSummary = vatRows
      .filter((vatLine) => vatLine.receiptId === receipt.id)
      .map(
        (vatLine) => `${vatLine.rate}% net ${vatLine.net} tax ${vatLine.tax}`,
      )
      .join("; ");
    const category = receipt.categoryId
      ? categoryById.get(receipt.categoryId)
      : null;
    const categoryBudget = receipt.categoryId
      ? budgetByCategoryId.get(receipt.categoryId)
      : null;

    return [
      EXPORT_SCHEMA_VERSION,
      exportedAt,
      monthKey,
      receipt.id,
      receipt.dateText,
      receipt.store,
      parseAddress(receipt.addressJson),
      category?.name ?? receipt.categoryName,
      categoryBudget?.limitAmount ?? "",
      receipt.total,
      activeMonthlyBudget?.currency ?? "",
      receipt.paymentMethod,
      receipt.cardLast4,
      receipt.note,
      receipt.imageUri,
      itemSummary,
      vatSummary,
    ];
  });

  return createCsv(headers, rows);
}

export async function exportMonthlyData(monthKey: string) {
  const fileName = getExportFileName(monthKey);
  const exportContent = buildMonthlyCsvExport(monthKey);

  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return null;
    }

    const uri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      EXPORT_MIME_TYPE,
    );

    await FileSystem.writeAsStringAsync(uri, exportContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { fileName, uri, savedToUserDirectory: true };
  }

  const exportDirectory = `${FileSystem.documentDirectory}exports/`;
  const uri = `${exportDirectory}${fileName}`;

  await FileSystem.makeDirectoryAsync(exportDirectory, { intermediates: true });
  await FileSystem.writeAsStringAsync(uri, exportContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { fileName, uri, savedToUserDirectory: false };
}
