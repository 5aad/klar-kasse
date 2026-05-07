import { eq } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import { monthlyBudgets, syncOutbox } from "@/db/schema";

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

export async function getMonthlyBudget(monthKey = getCurrentMonthKey()) {
  initializeDatabase();

  return (
    db
      .select()
      .from(monthlyBudgets)
      .where(eq(monthlyBudgets.monthKey, monthKey))
      .get() ?? null
  );
}

export async function saveMonthlyBudget(input: SaveMonthlyBudgetInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const monthKey = input.monthKey ?? getCurrentMonthKey();
  const limitAmount = Math.max(Number(input.limitAmount) || 0, 0);
  const existingBudget = await getMonthlyBudget(monthKey);
  const monthlyBudgetId = existingBudget?.id ?? createLocalId("monthly_budget");
  const operation = existingBudget ? "update" : "create";

  db.transaction((tx) => {
    if (existingBudget) {
      tx.update(monthlyBudgets)
        .set({
          limitAmount,
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
