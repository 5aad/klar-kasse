import { and, asc, eq, like, lt } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  categoryBudgets,
  monthlyBudgets,
  receiptItems,
  receiptLlmJobs,
  receipts,
  receiptVat,
  syncOutbox,
  type Receipt,
} from "@/db/schema";
import { getReceipt } from "@/api/receipts";
import {
  buildReceiptLlmPromptFromLines,
  parseReceiptLlmResponseWithFallback,
  type ReceiptLlmGenerator,
} from "@/utils/receipt-llm-parser";
import {
  RECEIPT_LLM_MAX_JOB_ATTEMPTS,
  getReceiptLlmFailureStatus,
  getReceiptLlmJobLines,
} from "@/utils/receipt-llm-jobs-model";
import type { ReceiptParseResult } from "@/utils/receipt-types";

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
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

function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function getReceiptFallback(receipt: Awaited<ReturnType<typeof getReceipt>>) {
  if (!receipt) return null;

  return {
    store: receipt.store,
    address: receipt.address,
    date: receipt.dateText ?? "",
    total: receipt.total,
    paymentMethod: receipt.paymentMethod ?? "",
    cardLast4: receipt.cardLast4 ?? "",
    itemCount: receipt.items.length,
    items: receipt.items.map((item) => ({
      name: item.name,
      price: item.price,
      ...(item.quantity ? { quantity: item.quantity } : {}),
      ...(item.unitPrice ? { unitPrice: item.unitPrice } : {}),
      ...(item.weightKg ? { weightKg: item.weightKg } : {}),
      ...(item.vatCode ? { vatCode: item.vatCode } : {}),
    })),
    vat: receipt.vat.map((vatLine) => ({
      rate: vatLine.rate,
      net: vatLine.net,
      tax: vatLine.tax,
    })),
    rawText: receipt.rawText ?? "",
    blocks: [],
  } satisfies ReceiptParseResult;
}

function getNextPendingJob() {
  return db
    .select()
    .from(receiptLlmJobs)
    .where(eq(receiptLlmJobs.status, "pending"))
    .orderBy(asc(receiptLlmJobs.createdAt))
    .get();
}

const RECEIPT_LLM_DEBUG = true;
const RECEIPT_LLM_DEBUG_TAG = "[ReceiptLLM]";

function debugReceiptLlmJob(label: string, value: unknown) {
  if (!RECEIPT_LLM_DEBUG) return;

  console.log(`${RECEIPT_LLM_DEBUG_TAG} ${label}`, value);
}

function formatJobError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function markJobFailed(
  jobId: string,
  error: unknown,
  attemptCount: number,
  retryable: boolean,
) {
  const now = new Date().toISOString();
  const status = retryable ? getReceiptLlmFailureStatus(attemptCount) : "failed";

  debugReceiptLlmJob("job failure", {
    jobId,
    status,
    attemptCount,
    error: formatJobError(error),
  });

  db.update(receiptLlmJobs)
    .set({
      status,
      lastError: formatJobError(error),
      startedAt: status === "pending" ? null : undefined,
      completedAt: status === "failed" ? now : null,
      updatedAt: now,
    })
    .where(eq(receiptLlmJobs.id, jobId))
    .run();

  return status;
}

function isModelAvailabilityError(error: unknown) {
  return formatJobError(error).includes("No model loaded");
}

function requeueJobForModelAvailability(
  jobId: string,
  previousAttemptCount: number,
  error: unknown,
) {
  const now = new Date().toISOString();

  debugReceiptLlmJob("job requeued until model is loaded", {
    jobId,
    attemptCount: previousAttemptCount,
    error: formatJobError(error),
  });

  db.update(receiptLlmJobs)
    .set({
      status: "pending",
      attemptCount: previousAttemptCount,
      lastError: formatJobError(error),
      startedAt: null,
      completedAt: null,
      updatedAt: now,
    })
    .where(eq(receiptLlmJobs.id, jobId))
    .run();
}

type DbClient = Pick<typeof db, "delete" | "insert" | "select" | "update">;

function adjustMonthlyBudget(
  database: DbClient,
  monthKey: string,
  delta: number,
  now: string,
) {
  if (Math.abs(delta) < 0.01) return;

  const existingMonthlyBudget = database
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();

  if (!existingMonthlyBudget) return;

  const nextSpentAmount = roundMoney(
    Math.max(existingMonthlyBudget.spentAmount + delta, 0),
  );

  database
    .update(monthlyBudgets)
    .set({
      spentAmount: nextSpentAmount,
      syncStatus: "pending",
      syncAction:
        existingMonthlyBudget.syncAction === "create" ? "create" : "update",
      updatedAt: now,
    })
    .where(eq(monthlyBudgets.id, existingMonthlyBudget.id))
    .run();

  database
    .insert(syncOutbox)
    .values({
      id: createLocalId("sync"),
      entityType: "monthly_budget",
      entityId: existingMonthlyBudget.id,
      operation:
        existingMonthlyBudget.syncAction === "create" ? "create" : "update",
      payloadJson: JSON.stringify({
        monthKey,
        spentAmount: nextSpentAmount,
      }),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

function adjustCategoryBudget(
  database: DbClient,
  receipt: Receipt,
  monthKey: string,
  delta: number,
  now: string,
) {
  if (!receipt.categoryId || Math.abs(delta) < 0.01) return;

  const monthlyBudget = database
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.monthKey, monthKey))
    .get();
  if (!monthlyBudget) return;

  const existingCategoryBudget =
    database
      .select()
      .from(categoryBudgets)
      .where(eq(categoryBudgets.monthlyBudgetId, monthlyBudget.id))
      .all()
      .find((row) => row.categoryId === receipt.categoryId) ?? null;
  if (!existingCategoryBudget) return;

  const nextSpentAmount = roundMoney(
    Math.max(existingCategoryBudget.spentAmount + delta, 0),
  );

  database
    .update(categoryBudgets)
    .set({
      spentAmount: nextSpentAmount,
      syncStatus: "pending",
      syncAction:
        existingCategoryBudget.syncAction === "create" ? "create" : "update",
      updatedAt: now,
    })
    .where(eq(categoryBudgets.id, existingCategoryBudget.id))
    .run();

  database
    .insert(syncOutbox)
    .values({
      id: createLocalId("sync"),
      entityType: "category_budget",
      entityId: existingCategoryBudget.id,
      operation:
        existingCategoryBudget.syncAction === "create" ? "create" : "update",
      payloadJson: JSON.stringify({
        categoryId: receipt.categoryId,
        monthKey,
        monthlyBudgetId: monthlyBudget.id,
        spentAmount: nextSpentAmount,
      }),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

function adjustBudgetsForReceiptUpdate(
  database: DbClient,
  receipt: Receipt,
  nextDateText: string,
  nextTotal: number,
  now: string,
) {
  const previousMonthKey =
    getMonthKeyFromDateText(receipt.dateText) ??
    getMonthKeyFromDateText(receipt.createdAt) ??
    getCurrentMonthKey();
  const nextMonthKey =
    getMonthKeyFromDateText(nextDateText) ?? previousMonthKey;

  if (previousMonthKey === nextMonthKey) {
    const delta = roundMoney(nextTotal - receipt.total);

    adjustMonthlyBudget(database, previousMonthKey, delta, now);
    adjustCategoryBudget(database, receipt, previousMonthKey, delta, now);
    return;
  }

  adjustMonthlyBudget(database, previousMonthKey, -receipt.total, now);
  adjustCategoryBudget(database, receipt, previousMonthKey, -receipt.total, now);
  adjustMonthlyBudget(database, nextMonthKey, nextTotal, now);
  adjustCategoryBudget(database, receipt, nextMonthKey, nextTotal, now);
}

function replaceReceiptDetails(
  receipt: Receipt,
  result: ReceiptParseResult,
  jobId: string,
) {
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const database = tx as unknown as DbClient;

    adjustBudgetsForReceiptUpdate(
      database,
      receipt,
      result.date,
      result.total,
      now,
    );

    database
      .update(receipts)
      .set({
        store: result.store.trim() || receipt.store,
        addressJson: JSON.stringify(result.address ?? []),
        dateText: result.date || receipt.dateText,
        total: result.total || receipt.total,
        paymentMethod: result.paymentMethod || receipt.paymentMethod,
        cardLast4: result.cardLast4 || receipt.cardLast4,
        itemCount: result.items.length,
        syncStatus: "pending",
        syncAction: receipt.syncAction === "create" ? "create" : "update",
        updatedAt: now,
      })
      .where(eq(receipts.id, receipt.id))
      .run();

    database
      .delete(receiptItems)
      .where(eq(receiptItems.receiptId, receipt.id))
      .run();
    database
      .delete(receiptVat)
      .where(eq(receiptVat.receiptId, receipt.id))
      .run();

    if (result.items.length) {
      database
        .insert(receiptItems)
        .values(
          result.items.map((item, index) => ({
            id: createLocalId("receipt_item"),
            receiptId: receipt.id,
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
          })),
        )
        .run();
    }

    if (result.vat.length) {
      database
        .insert(receiptVat)
        .values(
          result.vat.map((vatLine, index) => ({
            id: createLocalId("receipt_vat"),
            receiptId: receipt.id,
            lineIndex: index,
            rate: vatLine.rate,
            net: vatLine.net,
            tax: vatLine.tax,
            syncStatus: "pending",
            syncAction: "create",
            createdAt: now,
            updatedAt: now,
          })),
        )
        .run();
    }

    database
      .update(receiptLlmJobs)
      .set({
        status: "done",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(receiptLlmJobs.id, jobId))
      .run();

    database
      .insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "receipt",
        entityId: receipt.id,
        operation: receipt.syncAction === "create" ? "create" : "update",
        payloadJson: JSON.stringify({
          address: result.address ?? [],
          cardLast4: result.cardLast4,
          category: receipt.categoryName,
          date: result.date,
          imageUri: receipt.imageUri,
          items: result.items,
          note: receipt.note,
          paymentMethod: result.paymentMethod,
          rawText: receipt.rawText,
          store: result.store,
          total: result.total,
          vat: result.vat,
        }),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });
}

export function resetInterruptedReceiptLlmJobs() {
  initializeDatabase();

  const now = new Date().toISOString();

  db.update(receiptLlmJobs)
    .set({
      status: "pending",
      startedAt: null,
      updatedAt: now,
    })
    .where(eq(receiptLlmJobs.status, "processing"))
    .run();

  db.update(receiptLlmJobs)
    .set({
      status: "pending",
      completedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(receiptLlmJobs.status, "failed"),
        lt(receiptLlmJobs.attemptCount, RECEIPT_LLM_MAX_JOB_ATTEMPTS),
      ),
    )
    .run();

  db.update(receiptLlmJobs)
    .set({
      status: "pending",
      attemptCount: 0,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(receiptLlmJobs.status, "failed"),
        like(receiptLlmJobs.lastError, "%No model loaded%"),
      ),
    )
    .run();
}

export async function processNextReceiptLlmJob(
  generate: ReceiptLlmGenerator,
  onStatusChange?: () => void | Promise<void>,
) {
  initializeDatabase();

  const job = getNextPendingJob();
  if (!job) return false;

  const now = new Date().toISOString();
  const previousAttemptCount = job.attemptCount;
  const attemptCount = job.attemptCount + 1;

  db.update(receiptLlmJobs)
    .set({
      status: "processing",
      attemptCount,
      lastError: null,
      startedAt: now,
      updatedAt: now,
    })
    .where(eq(receiptLlmJobs.id, job.id))
    .run();
  await onStatusChange?.();

  try {
    const receipt = await getReceipt(job.receiptId);
    const fallback = getReceiptFallback(receipt);

    if (!receipt || !fallback || !receipt.rawText?.trim()) {
      markJobFailed(
        job.id,
        "Receipt rawText is not available.",
        attemptCount,
        false,
      );
      return true;
    }

    const lines = getReceiptLlmJobLines(receipt.rawText);
    const prompt = buildReceiptLlmPromptFromLines(lines);

    debugReceiptLlmJob("queued receipt input", {
      jobId: job.id,
      receiptId: receipt.id,
      attemptCount,
      lineCount: lines.length,
      lines,
    });
    debugReceiptLlmJob("queued receipt prompt", prompt);

    let response: string;
    try {
      response = await generate(prompt);
    } catch (error) {
      if (isModelAvailabilityError(error)) {
        requeueJobForModelAvailability(job.id, previousAttemptCount, error);
        return false;
      }

      throw error;
    }

    debugReceiptLlmJob("queued receipt output", {
      jobId: job.id,
      receiptId: receipt.id,
      response,
    });

    const result = parseReceiptLlmResponseWithFallback(response, fallback);

    if (!result) {
      const status = markJobFailed(job.id, response, attemptCount, true);
      return status === "failed";
    }

    const currentReceipt = db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receipt.id))
      .get();
    if (!currentReceipt) {
      markJobFailed(
        job.id,
        "Receipt was deleted before LLM update.",
        attemptCount,
        false,
      );
      return true;
    }

    replaceReceiptDetails(currentReceipt, result, job.id);
  } catch (error) {
    if (isModelAvailabilityError(error)) {
      requeueJobForModelAvailability(job.id, previousAttemptCount, error);
      return false;
    }

    const status = markJobFailed(job.id, error, attemptCount, true);
    return status === "failed";
  }

  return true;
}
