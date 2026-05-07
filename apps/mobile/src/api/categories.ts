import { and, asc, eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  categories,
  categoryBudgets,
  monthlyBudgets,
  receipts,
  syncOutbox,
  type Category,
} from "@/db/schema";

export type PostCategoryInput = {
  color?: string;
  icon?: string;
  isDefault?: boolean;
  limit?: number;
  name: string;
};

export type EditCategoryInput = Partial<PostCategoryInput> & {
  id: string;
};

export type CategoryWithBudget = Category & {
  budgetId: string | null;
  limitAmount: number;
  monthKey: string;
  spentAmount: number;
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
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

function getCategorySpentAmount(category: Category, monthKey: string) {
  return db
    .select()
    .from(receipts)
    .where(isNull(receipts.deletedAt))
    .all()
    .filter((receipt) => {
      const receiptMonthKey =
        getMonthKeyFromDateText(receipt.dateText) ??
        getMonthKeyFromDateText(receipt.createdAt);

      return (
        receiptMonthKey === monthKey &&
        (receipt.categoryId === category.id ||
          receipt.categoryName === category.name)
      );
    })
    .reduce((sum, receipt) => sum + receipt.total, 0);
}

function withCurrentBudget(category: Category): CategoryWithBudget {
  const monthKey = getCurrentMonthKey();
  const monthlyBudget = db
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();

  if (!monthlyBudget || monthlyBudget.deletedAt) {
    return {
      ...category,
      budgetId: null,
      limitAmount: 0,
      monthKey,
      spentAmount: getCategorySpentAmount(category, monthKey),
    };
  }

  const budget = db
    .select()
    .from(categoryBudgets)
    .where(
      and(
        eq(categoryBudgets.monthlyBudgetId, monthlyBudget.id),
        eq(categoryBudgets.categoryId, category.id),
      ),
    )
    .get();

  return {
    ...category,
    budgetId: budget?.id ?? null,
    limitAmount: budget?.limitAmount ?? 0,
    monthKey,
    spentAmount: getCategorySpentAmount(category, monthKey),
  };
}

function upsertCurrentCategoryBudget(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    categoryId: string;
    limitAmount: number;
    now: string;
  },
) {
  const monthKey = getCurrentMonthKey();
  const existingMonthlyBudget = tx
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();
  const monthlyBudgetId =
    existingMonthlyBudget?.id ?? createLocalId("monthly_budget");

  if (!existingMonthlyBudget) {
    tx.insert(monthlyBudgets)
      .values({
        id: monthlyBudgetId,
        monthKey,
        limitAmount: 0,
        spentAmount: 0,
        syncStatus: "pending",
        syncAction: "create",
        createdAt: input.now,
        updatedAt: input.now,
      })
      .run();
  } else if (existingMonthlyBudget.deletedAt) {
    tx.update(monthlyBudgets)
      .set({
        deletedAt: null,
        syncStatus: "pending",
        syncAction:
          existingMonthlyBudget.syncAction === "create" ? "create" : "update",
        updatedAt: input.now,
      })
      .where(eq(monthlyBudgets.id, existingMonthlyBudget.id))
      .run();
  }

  const existingCategoryBudget = tx
    .select()
    .from(categoryBudgets)
    .where(
      and(
        eq(categoryBudgets.monthlyBudgetId, monthlyBudgetId),
        eq(categoryBudgets.categoryId, input.categoryId),
      ),
    )
    .get();

  const categoryBudgetId =
    existingCategoryBudget?.id ?? createLocalId("category_budget");

  if (existingCategoryBudget) {
    tx.update(categoryBudgets)
      .set({
        deletedAt: null,
        limitAmount: input.limitAmount,
        syncStatus: "pending",
        syncAction:
          existingCategoryBudget.syncAction === "create" ? "create" : "update",
        updatedAt: input.now,
      })
      .where(eq(categoryBudgets.id, existingCategoryBudget.id))
      .run();
  } else {
    tx.insert(categoryBudgets)
      .values({
        id: categoryBudgetId,
        monthlyBudgetId,
        categoryId: input.categoryId,
        limitAmount: input.limitAmount,
        spentAmount: 0,
        syncStatus: "pending",
        syncAction: "create",
        createdAt: input.now,
        updatedAt: input.now,
      })
      .run();
  }

  tx.insert(syncOutbox)
    .values({
      id: createLocalId("sync"),
      entityType: "category_budget",
      entityId: categoryBudgetId,
      operation: existingCategoryBudget ? "update" : "create",
      payloadJson: JSON.stringify({
        categoryId: input.categoryId,
        limitAmount: input.limitAmount,
        monthKey,
      }),
      status: "pending",
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
}

export async function postCategory(input: PostCategoryInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const categoryId = createLocalId("category");
  const limitAmount = Math.max(Number(input.limit ?? 0) || 0, 0);

  db.transaction((tx) => {
    tx.insert(categories)
      .values({
        id: categoryId,
        name: input.name.trim(),
        icon: input.icon,
        color: input.color,
        isDefault: input.isDefault ?? false,
        syncStatus: "pending",
        syncAction: "create",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (limitAmount > 0) {
      upsertCurrentCategoryBudget(tx, {
        categoryId,
        limitAmount,
        now,
      });
    }

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category",
        entityId: categoryId,
        operation: "create",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getCategory(categoryId);
}

export async function editCategory(input: EditCategoryInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const existingCategory = await getCategory(input.id);

  if (!existingCategory) return null;

  const nextValues = {
    ...(input.name !== undefined ? { name: input.name.trim() } : undefined),
    ...(input.icon !== undefined ? { icon: input.icon } : undefined),
    ...(input.color !== undefined ? { color: input.color } : undefined),
    ...(input.isDefault !== undefined
      ? { isDefault: input.isDefault }
      : undefined),
    syncStatus: "pending",
    syncAction: existingCategory.syncAction === "create" ? "create" : "update",
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.update(categories)
      .set(nextValues)
      .where(eq(categories.id, input.id))
      .run();

    if (input.limit !== undefined) {
      upsertCurrentCategoryBudget(tx, {
        categoryId: input.id,
        limitAmount: Math.max(Number(input.limit) || 0, 0),
        now,
      });
    }

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category",
        entityId: input.id,
        operation: "update",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getCategory(input.id);
}

export async function deleteCategory(id: string) {
  initializeDatabase();

  const now = new Date().toISOString();
  const existingCategory = await getCategory(id);

  if (!existingCategory) return null;

  db.transaction((tx) => {
    tx.update(categories)
      .set({
        deletedAt: now,
        syncStatus: "pending",
        syncAction: existingCategory.syncAction === "create" ? "create" : "delete",
        updatedAt: now,
      })
      .where(eq(categories.id, id))
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category",
        entityId: id,
        operation: "delete",
        payloadJson: JSON.stringify({ id }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return { id };
}

export async function getCategory(id: string) {
  initializeDatabase();

  const category = db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .get();

  if (!category || category.deletedAt) return null;

  return withCurrentBudget(category);
}

export async function getCategories() {
  initializeDatabase();

  return db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(asc(categories.name))
    .all()
    .map(withCurrentBudget);
}
