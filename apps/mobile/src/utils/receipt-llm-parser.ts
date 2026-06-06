import {
  compactReceiptOcrBlocks,
  parseReceiptBlocks,
  type ReceiptOcrBlock,
} from "@/utils/receipt-block-parser";
import type { ReceiptItem, ReceiptParseResult } from "@/utils/receipt-types";

export type ReceiptLlmGenerator = (prompt: string) => Promise<string>;
export type ReceiptLlmFallbackReason =
  | "model_unavailable"
  | "invalid_model_output"
  | "model_error";
export type ReceiptLlmFallbackHandler = (
  reason: ReceiptLlmFallbackReason,
  details?: unknown,
) => void | Promise<void>;

const PAYMENT_METHODS = new Set(["Cash", "Visa", "Mastercard", "Debit"]);
const RECEIPT_LLM_DEBUG = true;
const RECEIPT_LLM_DEBUG_TAG = "[ReceiptLLM]";

export const RECEIPT_LLM_SYSTEM_PROMPT = [
  "You extract structured receipt data from OCR lines.",
  "Use only the provided compact OCR line data.",
  "Do not invent missing values.",
  "Return only valid JSON with no markdown, comments, or explanation.",
].join(" ");

export function buildReceiptLlmPrompt(blocks: ReceiptOcrBlock[]) {
  return buildReceiptLlmPromptFromInput(buildReceiptLlmInput(blocks));
}

export function buildReceiptLlmPromptFromLines(lines: string[]) {
  return buildReceiptLlmPromptFromInput({ lines });
}

function buildReceiptLlmPromptFromInput(compactInput: { lines: string[] }) {
  return [
    "Return only valid JSON for this receipt.",
    "",
    "Use this exact object shape:",
    JSON.stringify(
      {
        store: "string",
        address: ["string"],
        date: "DD.MM.YYYY or empty string",
        total: 0,
        paymentMethod: "Cash | Visa | Mastercard | Debit | empty string",
        cardLast4: "string",
        items: [
          {
            name: "string",
            price: 0,
            vatCode: "string",
          },
        ],
        vat: [{ rate: 0, net: 0, tax: 0 }],
      },
      null,
      2,
    ),
    "",
    "Rules:",
    "- Use numbers for money values, not strings.",
    "- If a field is missing, use empty string, 0, or [] as appropriate.",
    "- Date is an evidence field: copy it from an OCR line, do not guess or correct it.",
    "- For dates like 02.06.26 or 02-06-2026, keep the same day, month, and year digits; only normalize the separator to dots and expand YY to 20YY.",
    "- Never change year digits. If OCR says 2026 or 26, the date year must be 2026, not 2028.",
    "- If a date appears inside an address line, use it for date if it is the only date evidence, but do not include the date fragment in address.",
    "- If the header store name is noisy or missing, infer the store name from a visible website or domain line, for example 'NETTO-ONLINE.DE' means 'Netto'.",
    "- Keep item names exactly as recognized, but remove obvious price/tax suffixes.",
    "- Prefer the total near labels like SUMME, SUNNE, TOTAL, GESAMTBETRAG, or ZU ZAHLEN.",
    "- Item VAT code is only A, B, C, 1, 2, or 3 and appears immediately after the item price, for example '1,79 B'.",
    "- Put that trailing item VAT code in item.vatCode; do not turn VAT summary rows like 'B 7% ...' into receipt items.",
    "- The OCR lines are already ordered from top to bottom.",
    "- Never include keys outside the requested JSON shape.",
    "",
    "OCR compact line data:",
    JSON.stringify(compactInput, null, 2),
  ].join("\n");
}

export function buildReceiptLlmInput(blocks: ReceiptOcrBlock[]) {
  return {
    lines: compactReceiptOcrBlocks(blocks).map((block) => block.text),
  };
}

export async function parseReceiptWithLlmFallback(
  blocks: ReceiptOcrBlock[],
  generate?: ReceiptLlmGenerator | null,
  onFallback?: ReceiptLlmFallbackHandler,
): Promise<ReceiptParseResult> {
  const fallback = parseReceiptBlocks(blocks);
  const compactInput = buildReceiptLlmInput(blocks);

  debugReceiptLlm("compact line input", compactInput);

  if (!generate) {
    await onFallback?.("model_unavailable");
    debugReceiptLlm("fallback parser used before LLM generation", {
      reason: "model_not_ready_or_generate_unavailable",
      fallback,
    });
    return fallback;
  }

  try {
    const prompt = buildReceiptLlmPrompt(blocks);

    debugReceiptLlm("prompt sent to model", prompt);

    const response = await generate(prompt);

    debugReceiptLlm("raw model output", response);

    const parsed = parseReceiptLlmResponse(response);

    if (!parsed) {
      await onFallback?.("invalid_model_output", response);
      debugReceiptLlm("fallback parser used after invalid model output", {
        fallback,
      });
      return fallback;
    }

    const normalized = normalizeLlmReceipt(parsed, fallback);

    debugReceiptLlm("normalized model result", normalized);

    return normalized;
  } catch (error) {
    await onFallback?.("model_error", error);
    debugReceiptLlm("fallback parser used after model error", {
      error,
      fallback,
    });
    return fallback;
  }
}

export function parseReceiptLlmResponseWithFallback(
  response: string,
  fallback: ReceiptParseResult,
) {
  const parsed = parseReceiptLlmResponse(response);

  return parsed ? normalizeLlmReceipt(parsed, fallback) : null;
}

function debugReceiptLlm(label: string, value: unknown) {
  if (!RECEIPT_LLM_DEBUG) return;

  console.log(`${RECEIPT_LLM_DEBUG_TAG} ${label}`, value);
}

function parseReceiptLlmResponse(response: string) {
  const jsonText = extractJsonObject(response);
  if (!jsonText) return null;

  try {
    const parsed: unknown = JSON.parse(jsonText);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end <= start) return null;

  return candidate.slice(start, end + 1);
}

function normalizeLlmReceipt(
  parsed: Record<string, unknown>,
  fallback: ReceiptParseResult,
): ReceiptParseResult {
  const items = normalizeItems(parsed.items);
  const vat = normalizeVat(parsed.vat);
  const paymentMethod = toStringValue(parsed.paymentMethod);
  const date = normalizeSupportedDate(toStringValue(parsed.date), fallback);

  return {
    store: toStringValue(parsed.store) || fallback.store,
    address: normalizeStringArray(parsed.address) ?? fallback.address,
    date,
    total: toMoneyValue(parsed.total) || fallback.total,
    paymentMethod: PAYMENT_METHODS.has(paymentMethod)
      ? paymentMethod
      : fallback.paymentMethod,
    cardLast4: toStringValue(parsed.cardLast4) || fallback.cardLast4,
    itemCount: items.length || fallback.itemCount,
    items: items.length ? items : fallback.items,
    vat: vat.length ? vat : fallback.vat,
    rawText: fallback.rawText,
    blocks: fallback.blocks,
  };
}

function normalizeSupportedDate(
  modelDate: string,
  fallback: ReceiptParseResult,
) {
  if (!modelDate) return fallback.date;

  const normalizedModelDate = normalizeDateText(modelDate);
  if (!normalizedModelDate) return fallback.date;

  const rawDateSignatures = getDateSignatures(fallback.rawText);
  if (!rawDateSignatures.size) return normalizedModelDate;

  return rawDateSignatures.has(getDateSignature(normalizedModelDate))
    ? normalizedModelDate
    : fallback.date;
}

function normalizeDateText(value: string) {
  const match = value.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2}|\d{4})\b/);
  if (!match) return "";

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  return `${day}.${month}.${year}`;
}

function getDateSignatures(value: string) {
  const signatures = new Set<string>();
  const matches = value.matchAll(
    /\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2}|\d{4})\b/g,
  );

  for (const match of matches) {
    signatures.add(
      getDateSignature(
        `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${
          match[3].length === 2 ? `20${match[3]}` : match[3]
        }`,
      ),
    );
  }

  return signatures;
}

function getDateSignature(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeItems(value: unknown): ReceiptItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const name = toStringValue(item.name);
    const price = toMoneyValue(item.price);
    if (!name || price <= 0) return [];

    return [
      {
        name,
        price,
        ...(toPositiveNumber(item.quantity)
          ? { quantity: toPositiveNumber(item.quantity) }
          : {}),
        ...(toPositiveNumber(item.unitPrice)
          ? { unitPrice: toPositiveNumber(item.unitPrice) }
          : {}),
        ...(toPositiveNumber(item.weightKg)
          ? { weightKg: toPositiveNumber(item.weightKg) }
          : {}),
        ...(toStringValue(item.vatCode)
          ? { vatCode: toStringValue(item.vatCode) }
          : {}),
      },
    ];
  });
}

function normalizeVat(value: unknown): ReceiptParseResult["vat"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((vatLine) => {
    if (!isRecord(vatLine)) return [];

    const rate = toPositiveNumber(vatLine.rate);
    const net = toMoneyValue(vatLine.net);
    const tax = toMoneyValue(vatLine.tax);
    if (rate <= 0 && net <= 0 && tax <= 0) return [];

    return [{ rate, net, tax }];
  });
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const strings = value.map(toStringValue).filter(Boolean);
  return strings.length ? strings : undefined;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toMoneyValue(value: unknown) {
  const numberValue = toPositiveNumber(value);

  return Math.round(numberValue * 100) / 100;
}

function toPositiveNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", "."))
        : 0;

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
