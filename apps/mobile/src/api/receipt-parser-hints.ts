import { eq } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import { receiptParserHints } from "@/db/schema";

type ParsedReceiptFields = {
  rawText?: string;
  store?: string;
};

type CorrectedReceiptFields = {
  store: string;
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function normalizeHintText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function getHeaderLines(rawText: string) {
  return rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function isUsefulStorePattern(line: string) {
  return (
    line.length >= 3 &&
    /[A-Z]/.test(line) &&
    !/\b(summe|total|datum|uhrzeit|beleg|terminal|mwst|netto|brutto)\b/i.test(
      line,
    ) &&
    !/^\d+$/.test(line)
  );
}

function getStorePattern(rawText: string, correctedStore: string) {
  const normalizedStore = normalizeHintText(correctedStore);
  const lines = getHeaderLines(rawText);

  const matchingLine = lines
    .map((line) => normalizeHintText(line))
    .find(
      (line) =>
        isUsefulStorePattern(line) &&
        (line.includes(normalizedStore) || normalizedStore.includes(line)),
    );

  if (matchingLine) return matchingLine;
  if (normalizedStore.length >= 3) return normalizedStore;

  return null;
}

function hasMeaningfulStoreCorrection(
  parsedStore: string | undefined,
  correctedStore: string,
) {
  const parsed = normalizeHintText(parsedStore ?? "");
  const corrected = normalizeHintText(correctedStore);

  return corrected.length >= 3 && parsed !== corrected;
}

export async function applyReceiptParserHints<TReceipt extends ParsedReceiptFields>(
  receipt: TReceipt,
): Promise<TReceipt> {
  initializeDatabase();

  if (!receipt.rawText) return receipt;

  const normalizedRawText = normalizeHintText(receipt.rawText);
  const hints = db.select().from(receiptParserHints).all();
  const matchingHint = hints
    .filter((hint) => normalizedRawText.includes(hint.pattern))
    .sort((left, right) => right.useCount - left.useCount)[0];

  if (!matchingHint) return receipt;

  return {
    ...receipt,
    store: matchingHint.store,
  };
}

export async function saveReceiptParserCorrection(
  parsed: ParsedReceiptFields,
  corrected: CorrectedReceiptFields,
) {
  initializeDatabase();

  if (
    !parsed.rawText ||
    !hasMeaningfulStoreCorrection(parsed.store, corrected.store)
  ) {
    return;
  }

  const pattern = getStorePattern(parsed.rawText, corrected.store);
  if (!pattern) return;

  const now = new Date().toISOString();
  const existingHint = db
    .select()
    .from(receiptParserHints)
    .where(eq(receiptParserHints.pattern, pattern))
    .get();

  if (existingHint) {
    db.update(receiptParserHints)
      .set({
        store: corrected.store.trim(),
        useCount: existingHint.useCount + 1,
        updatedAt: now,
      })
      .where(eq(receiptParserHints.id, existingHint.id))
      .run();
    return;
  }

  db.insert(receiptParserHints)
    .values({
      id: createLocalId("receipt_parser_hint"),
      pattern,
      store: corrected.store.trim(),
      sampleHeader: getHeaderLines(parsed.rawText).slice(0, 12).join("\n"),
      useCount: 1,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}
