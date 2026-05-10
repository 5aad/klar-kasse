import { desc, eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  categories,
  categoryBudgets,
  monthlyBudgets,
  receiptItems,
  receiptVat,
  receipts,
  syncOutbox,
} from "@/db/schema";

export type SaveMonthlyBudgetInput = {
  currency?: string;
  limitAmount: number;
  monthKey?: string;
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

export function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthKeyFromDateText(dateText?: string | null) {
  if (!dateText) return null;

  const germanDate = dateText.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (germanDate) {
    const year =
      germanDate[3].length === 2
        ? `20${germanDate[3]}`
        : germanDate[3];

    return `${year}-${germanDate[2]}`;
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export async function getMonthlyBudget(monthKey = getCurrentMonthKey()) {
  initializeDatabase();

  const monthlyBudget = db
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();

  if (!monthlyBudget || monthlyBudget.deletedAt) return null;

  const spentAmount = db
    .select()
    .from(receipts)
    .where(isNull(receipts.deletedAt))
    .all()
    .filter((receipt) => {
      const receiptMonthKey =
        getMonthKeyFromDateText(receipt.dateText) ??
        getMonthKeyFromDateText(receipt.createdAt);

      return receiptMonthKey === monthKey;
    })
    .reduce((sum, receipt) => sum + receipt.total, 0);

  return {
    ...monthlyBudget,
    spentAmount,
  };
}

export async function getMonthlyBudgets() {
  initializeDatabase();

  const archives = new Map<
    string,
    {
      categoryBudgetCount: number;
      id: string;
      limitAmount: number;
      monthKey: string;
      receiptCount: number;
      spentAmount: number;
    }
  >();

  const activeMonthlyBudgets = db
    .select()
    .from(monthlyBudgets)
    .where(isNull(monthlyBudgets.deletedAt))
    .orderBy(desc(monthlyBudgets.monthKey))
    .all();

  for (const monthlyBudget of activeMonthlyBudgets) {
    const activeCategoryIds = new Set(
      db
        .select()
        .from(categoryBudgets)
        .where(eq(categoryBudgets.monthlyBudgetId, monthlyBudget.id))
        .all()
        .filter((categoryBudget) => {
          if (categoryBudget.deletedAt) return false;

          const category = db
            .select()
            .from(categories)
            .where(eq(categories.id, categoryBudget.categoryId))
            .get();

          return Boolean(category && !category.deletedAt);
        })
        .map((categoryBudget) => categoryBudget.categoryId),
    );

    archives.set(monthlyBudget.monthKey, {
      id: monthlyBudget.monthKey,
      monthKey: monthlyBudget.monthKey,
      limitAmount: monthlyBudget.limitAmount,
      spentAmount: 0,
      receiptCount: 0,
      categoryBudgetCount: activeCategoryIds.size,
    });
  }

  const activeReceipts = db
    .select()
    .from(receipts)
    .where(isNull(receipts.deletedAt))
    .all();

  for (const receipt of activeReceipts) {
    const monthKey =
      getMonthKeyFromDateText(receipt.dateText) ??
      getMonthKeyFromDateText(receipt.createdAt);

    if (!monthKey) continue;

    const archive =
      archives.get(monthKey) ??
      {
        id: monthKey,
        monthKey,
        limitAmount: 0,
        spentAmount: 0,
        receiptCount: 0,
        categoryBudgetCount: 0,
      };

    archives.set(monthKey, {
      ...archive,
      receiptCount: archive.receiptCount + 1,
      spentAmount: archive.spentAmount + receipt.total,
    });
  }

  return [...archives.values()].sort((left, right) =>
    right.monthKey.localeCompare(left.monthKey),
  );
}

export async function saveMonthlyBudget(input: SaveMonthlyBudgetInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const monthKey = input.monthKey ?? getCurrentMonthKey();
  const limitAmount = Math.max(Number(input.limitAmount) || 0, 0);
  const existingBudget =
    db
      .select()
      .from(monthlyBudgets)
      .where(eq(monthlyBudgets.monthKey, monthKey))
      .get() ?? null;
  const monthlyBudgetId = existingBudget?.id ?? createLocalId("monthly_budget");
  const operation = existingBudget ? "update" : "create";

  db.transaction((tx) => {
    if (existingBudget) {
      tx.update(monthlyBudgets)
        .set({
          deletedAt: null,
          limitAmount,
          spentAmount: existingBudget.deletedAt ? 0 : existingBudget.spentAmount,
          currency: input.currency ?? existingBudget.currency,
          syncStatus: "pending",
          syncAction:
            existingBudget.syncAction === "create" ? "create" : "update",
          updatedAt: now,
        })
        .where(eq(monthlyBudgets.id, existingBudget.id))
        .run();
    } else {
      tx.insert(monthlyBudgets)
        .values({
          id: monthlyBudgetId,
          monthKey,
          limitAmount,
          spentAmount: 0,
          currency: input.currency ?? "EUR",
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
        operation,
        payloadJson: JSON.stringify({
          currency: input.currency ?? existingBudget?.currency ?? "EUR",
          limitAmount,
          monthKey,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getMonthlyBudget(monthKey);
}

export async function deleteMonthlyBudget(monthKey: string) {
  initializeDatabase();

  const now = new Date().toISOString();
  const existingBudget = db
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();

  db.transaction((tx) => {
    const receiptsToDelete = tx
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

    const receiptCategoryNames = new Set(
      receiptsToDelete
        .map((receipt) => receipt.categoryName)
        .filter((categoryName): categoryName is string =>
          Boolean(categoryName),
        ),
    );

    const relatedCategoryIds = new Set<string>();

    if (existingBudget) {
      for (const categoryBudget of tx
        .select()
        .from(categoryBudgets)
        .where(eq(categoryBudgets.monthlyBudgetId, existingBudget.id))
        .all()) {
        relatedCategoryIds.add(categoryBudget.categoryId);
      }
    }

    if (receiptCategoryNames.size) {
      for (const category of tx.select().from(categories).all()) {
        if (!category.deletedAt && receiptCategoryNames.has(category.name)) {
          relatedCategoryIds.add(category.id);
        }
      }
    }

    if (existingBudget) {
      tx.update(monthlyBudgets)
        .set({
          deletedAt: now,
          syncStatus: "pending",
          syncAction:
            existingBudget.syncAction === "create" ? "create" : "delete",
          updatedAt: now,
        })
        .where(eq(monthlyBudgets.id, existingBudget.id))
        .run();

      tx.update(categoryBudgets)
        .set({
          deletedAt: now,
          syncStatus: "pending",
          syncAction: "delete",
          updatedAt: now,
        })
        .where(eq(categoryBudgets.monthlyBudgetId, existingBudget.id))
        .run();
    }

    for (const categoryId of [...relatedCategoryIds]) {
      const category = tx
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .get();

      if (!category || category.deletedAt) continue;

      tx.update(categories)
        .set({
          deletedAt: now,
          syncStatus: "pending",
          syncAction: category.syncAction === "create" ? "create" : "delete",
          updatedAt: now,
        })
        .where(eq(categories.id, categoryId))
        .run();

      tx.insert(syncOutbox)
        .values({
          id: createLocalId("sync"),
          entityType: "category",
          entityId: categoryId,
          operation: "delete",
          payloadJson: JSON.stringify({ id: categoryId }),
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    for (const receipt of receiptsToDelete) {
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
    }

    if (existingBudget) {
      tx.insert(syncOutbox)
        .values({
          id: createLocalId("sync"),
          entityType: "monthly_budget",
          entityId: existingBudget.id,
          operation: "delete",
          payloadJson: JSON.stringify({
            id: existingBudget.id,
            monthKey,
          }),
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });

  return { monthKey };
}
