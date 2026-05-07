import { desc, eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import {
  receiptItems,
  receipts,
  receiptVat,
  syncOutbox,
  type Receipt,
  type ReceiptItem,
  type ReceiptVat,
} from "@/db/schema";

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
  time?: string;
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

function toReceiptWithDetails(
  receipt: Receipt,
  items: ReceiptItem[],
  vat: ReceiptVat[],
): ReceiptWithDetails {
  return {
    ...receipt,
    address: parseAddress(receipt.addressJson),
    items,
    vat,
  };
}

export async function postReceipt(input: PostReceiptInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const receiptId = createLocalId("receipt");
  const receiptRows = [
    {
      id: receiptId,
      store: input.store.trim() || "Unknown merchant",
      categoryName: input.category,
      addressJson: JSON.stringify(input.address ?? []),
      dateText: input.date,
      timeText: input.time,
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

  db.transaction((tx) => {
    tx.insert(receipts).values(receiptRows).run();

    if (itemRows.length) {
      tx.insert(receiptItems).values(itemRows).run();
    }

    if (vatRows.length) {
      tx.insert(receiptVat).values(vatRows).run();
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
  });

  return getReceipt(receiptId);
}

export async function getReceipt(id: string) {
  initializeDatabase();

  const receipt = db
    .select()
    .from(receipts)
    .where(eq(receipts.id, id))
    .get();

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

  return toReceiptWithDetails(receipt, items, vat);
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

    return toReceiptWithDetails(receipt, items, vat);
  });
}
