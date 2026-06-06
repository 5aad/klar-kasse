import { desc, eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  categories,
  categoryBudgets,
  monthlyBudgets,
  receiptItems,
  receiptLlmJobs,
  receipts,
  receiptVat,
  syncOutbox,
  type Receipt,
  type ReceiptItem,
  type ReceiptVat,
} from "@/db/schema";
import {
  shouldEnqueueReceiptLlmJob,
  type ReceiptLlmJobStatus,
} from "@/utils/receipt-llm-jobs-model";

export type PostReceiptInput = {
  address?: string[];
  cardLast4?: string;
  category?: string;
  date?: string;
  imageUri?: string;
  items?: {
    name: string;
    price: number;
    quantity?: number;
    unitPrice?: number;
    vatCode?: string;
    weightKg?: number;
  }[];
  note?: string;
  paymentMethod?: string;
  rawText?: string;
  store: string;
  total: number;
  vat?: {
    net: number;
    rate: number;
    tax: number;
  }[];
};

export type ReceiptWithDetails = Receipt & {
  address: string[];
  items: ReceiptItem[];
  llmJobStatus: ReceiptLlmJobStatus | null;
  vat: ReceiptVat[];
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function parseAddress(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toReceiptWithDetails(
  receipt: Receipt,
  items: ReceiptItem[],
  vat: ReceiptVat[],
  llmJobStatus: ReceiptLlmJobStatus | null,
): ReceiptWithDetails {
  return {
    ...receipt,
    address: parseAddress(receipt.addressJson),
    items,
    llmJobStatus,
    vat,
  };
}

function normalizeReceiptLlmJobStatus(value?: string | null) {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "done" ||
    value === "failed"
  ) {
    return value;
  }

  return null;
}

function getLatestReceiptLlmJobStatus(receiptId: string) {
  const job = db
    .select()
    .from(receiptLlmJobs)
    .where(eq(receiptLlmJobs.receiptId, receiptId))
    .orderBy(desc(receiptLlmJobs.createdAt))
    .get();

  return normalizeReceiptLlmJobStatus(job?.status);
}

export async function postReceipt(input: PostReceiptInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const receiptId = createLocalId("receipt");
  const monthKey = getMonthKeyFromDateText(input.date) ?? getCurrentMonthKey();
  const category = input.category
    ? db
        .select()
        .from(categories)
        .where(eq(categories.name, input.category))
        .all()
        .find((row) => !row.deletedAt)
    : null;
  const receiptRows = [
    {
      id: receiptId,
      store: input.store.trim() || "Unknown merchant",
      categoryId: category?.id,
      categoryName: input.category,
      addressJson: JSON.stringify(input.address ?? []),
      dateText: input.date,
      total: input.total,
      paymentMethod: input.paymentMethod,
      cardLast4: input.cardLast4,
      itemCount: input.items?.length ?? 0,
      rawText: input.rawText,
      imageUri: input.imageUri,
      note: input.note,
      syncStatus: "pending",
      syncAction: "create",
      createdAt: now,
      updatedAt: now,
    },
  ];
  const itemRows =
    input.items?.map((item, index) => ({
      id: createLocalId("receipt_item"),
      receiptId,
      lineIndex: index,
      name: item.name.trim() || "Receipt item",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      weightKg: item.weightKg,
      price: item.price,
      vatCode: item.vatCode,
      syncStatus: "pending",
      syncAction: "create",
      createdAt: now,
      updatedAt: now,
    })) ?? [];
  const vatRows =
    input.vat?.map((vatLine, index) => ({
      id: createLocalId("receipt_vat"),
      receiptId,
      lineIndex: index,
      rate: vatLine.rate,
      net: vatLine.net,
      tax: vatLine.tax,
      syncStatus: "pending",
      syncAction: "create",
      createdAt: now,
      updatedAt: now,
    })) ?? [];
  const receiptLlmJobRow = shouldEnqueueReceiptLlmJob(input.rawText)
    ? {
        id: createLocalId("receipt_llm_job"),
        receiptId,
        status: "pending",
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      }
    : null;

  db.transaction((tx) => {
    tx.insert(receipts).values(receiptRows).run();

    if (itemRows.length) {
      tx.insert(receiptItems).values(itemRows).run();
    }

    if (vatRows.length) {
      tx.insert(receiptVat).values(vatRows).run();
    }

    if (receiptLlmJobRow) {
      tx.insert(receiptLlmJobs).values(receiptLlmJobRow).run();
    }

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "receipt",
        entityId: receiptId,
        operation: "create",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const existingMonthlyBudget =
      tx
        .select()
        .from(monthlyBudgets)
        .where(eq(monthlyBudgets.monthKey, monthKey))
        .get() ?? null;
    const monthlyBudgetId =
      existingMonthlyBudget?.id ?? createLocalId("monthly_budget");
    const monthlyBudgetOperation = existingMonthlyBudget ? "update" : "create";
    const currentMonthlySpent =
      existingMonthlyBudget && !existingMonthlyBudget.deletedAt
        ? existingMonthlyBudget.spentAmount
        : 0;
    const nextMonthlySpent = roundMoney(currentMonthlySpent + input.total);

    if (existingMonthlyBudget) {
      tx.update(monthlyBudgets)
        .set({
          deletedAt: null,
          limitAmount: existingMonthlyBudget.deletedAt
            ? 0
            : existingMonthlyBudget.limitAmount,
          spentAmount: nextMonthlySpent,
          syncStatus: "pending",
          syncAction:
            existingMonthlyBudget.syncAction === "create" ? "create" : "update",
          updatedAt: now,
        })
        .where(eq(monthlyBudgets.id, existingMonthlyBudget.id))
        .run();
    } else {
      tx.insert(monthlyBudgets)
        .values({
          id: monthlyBudgetId,
          monthKey,
          limitAmount: 0,
          spentAmount: nextMonthlySpent,
          currency: "EUR",
          syncStatus: "pending",
          syncAction: "create",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "monthly_budget",
        entityId: monthlyBudgetId,
        operation: monthlyBudgetOperation,
        payloadJson: JSON.stringify({
          monthKey,
          spentAmount: nextMonthlySpent,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (!category) return;

    const existingCategoryBudget =
      tx
        .select()
        .from(categoryBudgets)
        .where(eq(categoryBudgets.monthlyBudgetId, monthlyBudgetId))
        .all()
        .find((row) => row.categoryId === category.id) ?? null;
    const categoryBudgetId =
      existingCategoryBudget?.id ?? createLocalId("category_budget");
    const categoryBudgetOperation = existingCategoryBudget
      ? "update"
      : "create";
    const currentCategorySpent =
      existingCategoryBudget && !existingCategoryBudget.deletedAt
        ? existingCategoryBudget.spentAmount
        : 0;
    const nextCategorySpent = roundMoney(currentCategorySpent + input.total);

    if (existingCategoryBudget) {
      tx.update(categoryBudgets)
        .set({
          deletedAt: null,
          limitAmount: existingCategoryBudget.deletedAt
            ? 0
            : existingCategoryBudget.limitAmount,
          spentAmount: nextCategorySpent,
          syncStatus: "pending",
          syncAction:
            existingCategoryBudget.syncAction === "create"
              ? "create"
              : "update",
          updatedAt: now,
        })
        .where(eq(categoryBudgets.id, existingCategoryBudget.id))
        .run();
    } else {
      tx.insert(categoryBudgets)
        .values({
          id: categoryBudgetId,
          monthlyBudgetId,
          categoryId: category.id,
          limitAmount: 0,
          spentAmount: nextCategorySpent,
          syncStatus: "pending",
          syncAction: "create",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category_budget",
        entityId: categoryBudgetId,
        operation: categoryBudgetOperation,
        payloadJson: JSON.stringify({
          categoryId: category.id,
          monthKey,
          monthlyBudgetId,
          spentAmount: nextCategorySpent,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getReceipt(receiptId);
}

export async function getReceipt(id: string) {
  initializeDatabase();

  const receipt = db.select().from(receipts).where(eq(receipts.id, id)).get();

  if (!receipt || receipt.deletedAt) return null;

  const items = db
    .select()
    .from(receiptItems)
    .where(eq(receiptItems.receiptId, id))
    .all();
  const vat = db
    .select()
    .from(receiptVat)
    .where(eq(receiptVat.receiptId, id))
    .all();

  return toReceiptWithDetails(
    receipt,
    items,
    vat,
    getLatestReceiptLlmJobStatus(id),
  );
}

export async function deleteReceipt(id: string) {
  initializeDatabase();

  const receipt = db.select().from(receipts).where(eq(receipts.id, id)).get();

  if (!receipt || receipt.deletedAt) return null;

  const now = new Date().toISOString();
  const monthKey =
    getMonthKeyFromDateText(receipt.dateText) ??
    getMonthKeyFromDateText(receipt.createdAt) ??
    getCurrentMonthKey();
  const category = receipt.categoryId
    ? db
        .select()
        .from(categories)
        .where(eq(categories.id, receipt.categoryId))
        .get()
    : receipt.categoryName
      ? db
          .select()
          .from(categories)
          .where(eq(categories.name, receipt.categoryName))
          .all()
          .find((row) => !row.deletedAt)
      : null;
  const existingMonthlyBudget =
    db
      .select()
      .from(monthlyBudgets)
      .where(eq(monthlyBudgets.monthKey, monthKey))
      .get() ?? null;

  db.transaction((tx) => {
    tx.update(receiptItems)
      .set({
        deletedAt: now,
        syncStatus: "pending",
        syncAction: "delete",
        updatedAt: now,
      })
      .where(eq(receiptItems.receiptId, receipt.id))
      .run();

    tx.update(receiptVat)
      .set({
        deletedAt: now,
        syncStatus: "pending",
        syncAction: "delete",
        updatedAt: now,
      })
      .where(eq(receiptVat.receiptId, receipt.id))
      .run();

    tx.update(receipts)
      .set({
        deletedAt: now,
        syncStatus: "pending",
        syncAction: receipt.syncAction === "create" ? "create" : "delete",
        updatedAt: now,
      })
      .where(eq(receipts.id, receipt.id))
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "receipt",
        entityId: receipt.id,
        operation: "delete",
        payloadJson: JSON.stringify({ id: receipt.id, monthKey }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (!existingMonthlyBudget || existingMonthlyBudget.deletedAt) return;

    const nextMonthlySpent = roundMoney(
      Math.max(existingMonthlyBudget.spentAmount - receipt.total, 0),
    );

    tx.update(monthlyBudgets)
      .set({
        spentAmount: nextMonthlySpent,
        syncStatus: "pending",
        syncAction:
          existingMonthlyBudget.syncAction === "create" ? "create" : "update",
        updatedAt: now,
      })
      .where(eq(monthlyBudgets.id, existingMonthlyBudget.id))
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "monthly_budget",
        entityId: existingMonthlyBudget.id,
        operation: "update",
        payloadJson: JSON.stringify({
          monthKey,
          spentAmount: nextMonthlySpent,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (!category || category.deletedAt) return;

    const existingCategoryBudget =
      tx
        .select()
        .from(categoryBudgets)
        .where(eq(categoryBudgets.monthlyBudgetId, existingMonthlyBudget.id))
        .all()
        .find((row) => row.categoryId === category.id && !row.deletedAt) ??
      null;

    if (!existingCategoryBudget) return;

    const nextCategorySpent = roundMoney(
      Math.max(existingCategoryBudget.spentAmount - receipt.total, 0),
    );

    tx.update(categoryBudgets)
      .set({
        spentAmount: nextCategorySpent,
        syncStatus: "pending",
        syncAction:
          existingCategoryBudget.syncAction === "create" ? "create" : "update",
        updatedAt: now,
      })
      .where(eq(categoryBudgets.id, existingCategoryBudget.id))
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category_budget",
        entityId: existingCategoryBudget.id,
        operation: "update",
        payloadJson: JSON.stringify({
          categoryId: category.id,
          monthKey,
          monthlyBudgetId: existingMonthlyBudget.id,
          spentAmount: nextCategorySpent,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return { id: receipt.id, monthKey };
}

export async function getReceipts() {
  initializeDatabase();

  const receiptRows = db
    .select()
    .from(receipts)
    .where(isNull(receipts.deletedAt))
    .orderBy(desc(receipts.createdAt))
    .all();

  return receiptRows.map((receipt) => {
    const items = db
      .select()
      .from(receiptItems)
      .where(eq(receiptItems.receiptId, receipt.id))
      .all();
    const vat = db
      .select()
      .from(receiptVat)
      .where(eq(receiptVat.receiptId, receipt.id))
      .all();

    return toReceiptWithDetails(
      receipt,
      items,
      vat,
      getLatestReceiptLlmJobStatus(receipt.id),
    );
  });
}
