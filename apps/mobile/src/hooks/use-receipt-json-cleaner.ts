import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fixAndValidateStructuredOutput,
  LLMModule,
  QWEN3_0_6B_QUANTIZED,
  type Message,
} from "react-native-executorch";
import * as z from "zod/v4";

import { parseNormaReceipt } from "@/utils/receipt-parser";

function asString(value: unknown) {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean);
  }

  const text = asString(value);

  if (!text) return [];

  return text
    .split(/\n|;|,\s*(?=\d{5}\b)/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const StringSchema = z.preprocess(asString, z.string());
const NumberSchema = z.preprocess(asNumber, z.number());
const StringArraySchema = z.preprocess(asStringArray, z.array(z.string()));

export const ReceiptSchema = z.object({
  store: StringSchema.default(""),
  address: StringArraySchema.default([]),
  date: StringSchema.default(""),
  paymentMethod: StringSchema.default(""),
  cardLast4: StringSchema.default(""),
  itemCount: NumberSchema.default(0),
  total: NumberSchema.default(0),
  items: z
    .array(
      z.object({
        name: StringSchema,
        price: NumberSchema,
        vatCode: StringSchema.optional(),
      }),
    )
    .default([]),
  vat: z
    .array(
      z.object({
        rate: NumberSchema,
        net: NumberSchema,
        tax: NumberSchema,
      }),
    )
    .default([]),
});

export type ReceiptJson = z.infer<typeof ReceiptSchema>;

export type ReceiptJsonWithRawText = Partial<ReceiptJson> & {
  rawText?: string;
};

type CleanReceiptJsonResult = {
  source: "llm";
  data: ReceiptJson;
  messages: Message[];
};

type CleanerState = {
  downloadProgress: number;
  error: unknown;
  isReady: boolean;
  messageHistory: Message[];
  response: string;
};

type CleanerListener = (state: CleanerState) => void;

const MAX_OCR_PROMPT_CHARS = 3500;
const MONEY_PATTERN =
  "\\d{1,3}(?:\\.\\d{3})*,\\d{2}(?!\\d)|\\d{1,4}[,.]\\d{2}(?!\\d)";
const listeners = new Set<CleanerListener>();

let llm: LLMModule | null = null;
let loadPromise: Promise<LLMModule> | null = null;
let state: CleanerState = {
  downloadProgress: 0,
  error: null,
  isReady: false,
  messageHistory: [],
  response: "",
};

function setCleanerState(nextState: Partial<CleanerState>) {
  state = { ...state, ...nextState };

  for (const listener of listeners) {
    listener(state);
  }
}

function withoutRawText(receipt: ReceiptJsonWithRawText) {
  const { rawText, ...receiptJson } = receipt;

  return receiptJson;
}

function limitPromptText(text: string) {
  if (text.length <= MAX_OCR_PROMPT_CHARS) return text;

  return `${text.slice(0, MAX_OCR_PROMPT_CHARS)}\n[OCR truncated]`;
}

function parseMoneyText(value: string) {
  return asNumber(value);
}

function hasTotalContext(text: string) {
  return /\b(summe|total|gesamt|zu\s*zahlen|betrag|brutto|einkaufswert)\b/i.test(
    text,
  );
}

function hasPaymentContext(text: string) {
  return /\b(visa|mastercard|karte|kreditkarte|bankkarte|ec[-\s]?cash|bezahlung|zahlung|contactless|kontaktlos)\b/i.test(
    text,
  );
}

function isTaxOrMetaLine(text: string) {
  return /\b(netto|exkl|mwst|ust|vat|steuer|tax|pfand|rabatt|preisvorteil|zurueck|zurück)\b/i.test(
    text,
  );
}

function isDateOrTimeLine(text: string) {
  return (
    /\b\d{1,2}[.,]\d{1,2}[.,]\d{2,4}\b/.test(text) ||
    /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(text) ||
    /\b20\d{2}-\d{2}-\d{2}T/.test(text)
  );
}

function isPlausibleTotal(value: number) {
  return Number.isFinite(value) && value > 0 && value < 10000;
}

function findFinalPaidTotal(rawText?: string) {
  if (!rawText) return null;

  const lines = rawText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const moneyRegex = new RegExp(MONEY_PATTERN, "g");
  const candidates: { amount: number; score: number }[] = [];

  lines.forEach((line, index) => {
    const context = [
      lines[index - 2] ?? "",
      lines[index - 1] ?? "",
      line,
      lines[index + 1] ?? "",
      lines[index + 2] ?? "",
    ].join(" ");
    const hasCurrency = /(?:€|eur)/i.test(line);
    const totalContext = hasTotalContext(context);
    const paymentContext = hasPaymentContext(context);
    const dateOrTime = isDateOrTimeLine(line);
    const taxOrMeta = isTaxOrMetaLine(context);

    for (const match of line.matchAll(moneyRegex)) {
      const amount = parseMoneyText(match[0]);

      if (!isPlausibleTotal(amount)) continue;

      let score = 0;

      if (hasCurrency) score += 180;
      if (hasTotalContext(line)) score += 170;
      if (totalContext) score += 110;
      if (hasPaymentContext(line)) score += 130;
      if (paymentContext) score += 80;
      if (dateOrTime && !hasCurrency && !totalContext && !paymentContext) {
        score -= 240;
      }
      if (taxOrMeta) score -= 130;
      if (/^\s*-/.test(line)) score -= 120;
      if (/%/.test(line) || /\b[ABX]\s*$/i.test(line)) score -= 45;

      candidates.push({ amount, score });
    }
  });

  const best = candidates
    .filter((candidate) => candidate.score >= 100)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.amount - left.amount,
    )[0];

  return best?.amount ?? null;
}

function findPaymentMethod(rawText?: string) {
  if (!rawText) return "";

  if (/master\s*card|mastercard/i.test(rawText)) return "Mastercard";
  if (/visa|v1sa/i.test(rawText)) return "Visa";
  if (/bar[-\s]?zahlung|\bbar\b|\bcash\b/i.test(rawText)) return "Cash";
  if (/ec[-\s]?cash|bankkarte|debit|girocard|maestro|ec[-\s]?karte|kreditkarte|karte/i.test(rawText)) {
    return "Debit";
  }

  return "";
}

function findCardLast4(rawText?: string) {
  if (!rawText) return "";

  const cardLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      /[*#]{2,}|kartennr|pan|card|visa|mastercard/i.test(line),
    );

  for (const line of cardLines) {
    const digitGroups = [...line.matchAll(/\d{4}/g)]
      .map((match) => match[0])
      .filter((value) => value !== "0000" && value !== "0750");

    if (digitGroups.length) {
      return digitGroups[0];
    }
  }

  return "";
}

function applyRawTextSanity(
  receipt: ReceiptJson,
  sourceReceipt?: ReceiptJsonWithRawText,
): ReceiptJson {
  const rawText = sourceReceipt?.rawText;

  if (!rawText) {
    return {
      ...receipt,
      itemCount: receipt.items.length,
    };
  }

  const parserReceipt = parseNormaReceipt(rawText);
  const total = findFinalPaidTotal(rawText) ?? parserReceipt.total;
  const paymentMethod = findPaymentMethod(rawText) || parserReceipt.paymentMethod;
  const cardLast4 = findCardLast4(rawText) || parserReceipt.cardLast4;

  return {
    ...receipt,
    date: parserReceipt.date || receipt.date,
    paymentMethod: paymentMethod || receipt.paymentMethod,
    cardLast4: cardLast4 || receipt.cardLast4,
    total: total > 0 ? total : receipt.total,
    itemCount: receipt.items.length,
  };
}

function isDuplicateDownloadError(error: unknown) {
  return String(error instanceof Error ? error.message : error).includes(
    "Already downloading this file",
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadModelWithRetry(attempt = 0): Promise<LLMModule> {
  try {
    return await LLMModule.fromModelName(
      QWEN3_0_6B_QUANTIZED,
      (progress) => setCleanerState({ downloadProgress: progress }),
      (token) => setCleanerState({ response: state.response + token }),
      (messages) => setCleanerState({ messageHistory: messages }),
    );
  } catch (error) {
    if (isDuplicateDownloadError(error) && attempt < 30) {
      await wait(2000);
      return loadModelWithRetry(attempt + 1);
    }

    throw error;
  }
}

function buildSystemPrompt() {
  return `
/no_think

Extract receipt fields from noisy OCR text.
Return ONLY one minified JSON object on one line. No markdown. No spaces/newlines.
Output keys exactly: store,address,date,paymentMethod,cardLast4,itemCount,items,total,vat.
Do NOT output rawText, quantity, unitPrice, weightKg, explanations, or extra keys.

General rules:
- OCR text is the source of truth; use current parsed JSON only as a hint.
- Keep unknown values as "", [], or 0.
- Preserve readable merchant/product/address text; fix obvious OCR splits only.
- Dates output DD.MM.YYYY. Money output decimal numbers.

store:
- Use the real merchant name from header/footer/company block.
- Reject city, street, product, tax id, terminal id, receipt id, slogans.
- Normalize obvious store OCR variants only when clear.

address:
- Store address lines only: street/building and postal-code/city.
- Exclude phone, VAT/tax ids, cashier, opening hours, receipt/terminal/payment/product lines.

total:
- Final gross amount paid by customer.
- Prefer nearby labels: SUMME, TOTAL, GESAMT, ZU ZAHLEN, BETRAG, BRUTTO, EUR, card payment amount.
- Ignore NETTO, EXKL, MWST/VAT/tax, pfand-only, discount-only, change/return money.
- If several candidates repeat in payment/summary/footer, choose the repeated final paid amount.

payment/card:
- paymentMethod is Cash, Visa, Mastercard, Debit, or "".
- Detect card brands from VISA/Mastercard/EC/Karte/Kreditkarte/Bankkarte/contactless.
- Cash from Barzahlung/BAR/cash.
- cardLast4 is last four digits from masked card/PAN/Kartennr lines; strip letters/symbols.
- Do not use terminal id, auth code, receipt number, time, date, VAT id, or transaction number as cardLast4.

items:
- items contain only clear purchased products with final item price and optional VAT code.
- item shape: {"name":string,"price":number,"vatCode"?:string}.
- Exclude metadata, store/address, payment, VAT summaries, date/time, receipt ids, loyalty/app text.
- For quantity math lines, output only product name and final line price.
- itemCount must equal items.length.

vat:
- VAT summary only, not item prices.
- Include rows only when rate, net, and tax are clearly connected.
`.trim();
}

function buildUserPrompt(receipt: ReceiptJsonWithRawText) {
  return `
/no_think

Fix this receipt JSON in one pass.

Current parsed JSON:
${JSON.stringify(withoutRawText(receipt))}

OCR text:
${limitPromptText(receipt.rawText ?? "")}
`.trim();
}

function extractFirstJsonObject(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error(
      "The local model returned an empty response. Try again, or use a shorter OCR/rawText input.",
    );
  }

  const firstBrace = trimmed.indexOf("{");

  if (firstBrace < 0) {
    throw new Error(`The local model did not return JSON: ${trimmed.slice(0, 160)}`);
  }

  let depth = 0;
  let isInString = false;
  let isEscaped = false;

  for (let index = firstBrace; index < trimmed.length; index += 1) {
    const character = trimmed[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      isEscaped = isInString;
      continue;
    }

    if (character === '"') {
      isInString = !isInString;
      continue;
    }

    if (isInString) continue;

    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;

    if (depth === 0) {
      return trimmed.slice(firstBrace, index + 1);
    }
  }

  throw new Error(
    `The local model returned incomplete JSON: ${trimmed.slice(firstBrace, firstBrace + 220)}`,
  );
}

function validateCleanerResponse(
  response: string,
  sourceReceipt?: ReceiptJsonWithRawText,
) {
  const receipt = fixAndValidateStructuredOutput(
    extractFirstJsonObject(response),
    ReceiptSchema,
  );

  return applyRawTextSanity(receipt, sourceReceipt);
}

function ensureCleanerReady(systemPrompt: string) {
  if (llm) return Promise.resolve(llm);
  if (loadPromise) return loadPromise;

  loadPromise = loadModelWithRetry()
    .then((loadedModel) => {
      loadedModel.configure({
        chatConfig: {
          systemPrompt,
        },
        generationConfig: {
          temperature: 0,
          topP: 0.1,
        },
      });

      llm = loadedModel;
      setCleanerState({ error: null, isReady: true });
      return loadedModel;
    })
    .catch((error) => {
      loadPromise = null;
      setCleanerState({ error, isReady: false });
      throw error;
    });

  return loadPromise;
}

export function useReceiptJsonCleaner() {
  const [localState, setLocalState] = useState(state);
  const [isGenerating, setIsGenerating] = useState(false);
  const systemPrompt = useMemo(buildSystemPrompt, []);

  useEffect(() => {
    listeners.add(setLocalState);
    setCleanerState({ error: null });

    ensureCleanerReady(systemPrompt).catch((error) => {
      setCleanerState({ error });
    });

    return () => {
      listeners.delete(setLocalState);
    };
  }, [systemPrompt]);

  const cleanReceiptJson = useCallback(
    async (
      receipt: ReceiptJsonWithRawText,
    ): Promise<CleanReceiptJsonResult> => {
      const model = await ensureCleanerReady(systemPrompt);

      setIsGenerating(true);
      setCleanerState({ error: null, messageHistory: [], response: "" });

      try {
        const prompt = buildUserPrompt(receipt);
        const response = await model.generate([
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ]);
        const messages: Message[] = [
          { role: "user", content: prompt },
          { role: "assistant", content: response },
        ];

        const data = validateCleanerResponse(response, receipt);

        setCleanerState({ messageHistory: messages, response });

        return {
          source: "llm",
          data,
          messages,
        };
      } catch (error) {
        setCleanerState({ error });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [systemPrompt],
  );

  const getCleanedJson = useCallback(() => {
    const assistantMessage = localState.messageHistory.findLast(
      (message) => message.role === "assistant",
    );

    if (!assistantMessage || isGenerating) return null;

    return validateCleanerResponse(assistantMessage.content);
  }, [isGenerating, localState.messageHistory]);

  const interrupt = useCallback(() => {
    llm?.interrupt();
    setIsGenerating(false);
  }, []);

  return {
    cleanReceiptJson,
    getCleanedJson,
    interrupt,
    response: localState.response,
    messageHistory: localState.messageHistory,
    downloadProgress: localState.downloadProgress,
    isReady: localState.isReady,
    isGenerating,
    error: localState.error,
  };
}
