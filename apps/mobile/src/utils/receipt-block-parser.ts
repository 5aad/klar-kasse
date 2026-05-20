import type { ReceiptItem, ReceiptParseResult } from "@/utils/receipt-parser";

export type ReceiptOcrFrame = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type ReceiptOcrElement = {
  text?: string;
  frame?: ReceiptOcrFrame;
};

export type ReceiptOcrLine = {
  text?: string;
  frame?: ReceiptOcrFrame;
  elements?: ReceiptOcrElement[];
};

export type ReceiptOcrBlock = {
  text?: string;
  frame?: ReceiptOcrFrame;
  lines?: ReceiptOcrLine[];
};

type ParsedLine = {
  text: string;
  frame: ReceiptOcrFrame;
  blockIndex: number;
  lineIndex: number;
};

type VisualRow = {
  text: string;
  frame: ReceiptOcrFrame;
  lines: ParsedLine[];
};

type PriceMatch = {
  amount: number;
  raw: string;
  index: number;
  vatCode?: string;
};

const MONEY_AMOUNT =
  "\\d{1,3}(?:\\.\\d{3})*,\\d{2}(?!\\d)|\\d{1,4}[,.]\\d{2}(?!\\d)";
const MONEY_AMOUNT_RE = new RegExp(MONEY_AMOUNT);
const MONEY_AMOUNT_GLOBAL_RE = new RegExp(MONEY_AMOUNT, "g");
const RECEIPT_MAX_AMOUNT = 1000;

function parseReceiptMoney(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastDot > lastComma) {
    return Number(cleaned.replace(/,/g, ""));
  }

  return Number(cleaned.replace(/\./g, "").replace(",", "."));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function hasFrame(value: { frame?: ReceiptOcrFrame }): value is {
  frame: ReceiptOcrFrame;
} {
  return (
    typeof value.frame?.top === "number" &&
    typeof value.frame.left === "number" &&
    typeof value.frame.width === "number" &&
    typeof value.frame.height === "number"
  );
}

function mergeFrames(frames: ReceiptOcrFrame[]): ReceiptOcrFrame {
  const left = Math.min(...frames.map((frame) => frame.left));
  const top = Math.min(...frames.map((frame) => frame.top));
  const right = Math.max(...frames.map((frame) => frame.left + frame.width));
  const bottom = Math.max(...frames.map((frame) => frame.top + frame.height));

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

function getFrameCenterY(frame: ReceiptOcrFrame) {
  return frame.top + frame.height / 2;
}

function normalizeOcrText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFKC")
    .replace(/\u00df/g, "ss")
    .replace(/\bRuckgeld\b/gi, "Rueckgeld")
    .replace(/\bGesantbetrag\b/gi, "Gesamtbetrag")
    .replace(/\bNetto\b/gi, "Netto")
    .replace(/\bBrytto\b/gi, "Brutto")
    .replace(/\bSteuet\b/gi, "Steuer")
    .replace(/\bIWAFFELN\b/gi, "WAFFELN")
    .replace(/\bV[1I]SA\b/gi, "VISA")
    .replace(/(\d)\s*([,.])\s*(\d{2})(?=\D|$)/g, "$1$2$3")
    .replace(/\b(\d)\s*,\s*(\d)(?=\s*%)/g, "$1,$2")
    .replace(/\s+/g, " ")
    .trim();
}

function getLineText(line: ReceiptOcrLine) {
  if (line.elements?.length) {
    const elementText = line.elements
      .filter(
        (element): element is ReceiptOcrElement & { frame: ReceiptOcrFrame } =>
          Boolean(element.text?.trim()) && hasFrame(element),
      )
      .sort((left, right) => left.frame.left - right.frame.left)
      .map((element) => element.text?.trim())
      .join(" ");

    if (elementText.trim()) return normalizeOcrText(elementText);
  }

  return normalizeOcrText(line.text ?? "");
}

function flattenBlockLines(blocks: ReceiptOcrBlock[]): ParsedLine[] {
  return blocks.flatMap((block, blockIndex) => {
    const sourceLines = block.lines?.length
      ? block.lines
      : block.text
        ? [{ text: block.text, frame: block.frame }]
        : [];

    return sourceLines.flatMap((line, lineIndex) => {
      const text = getLineText(line);
      if (!text || !hasFrame(line)) return [];

      return [
        {
          text,
          frame: line.frame,
          blockIndex,
          lineIndex,
        },
      ];
    });
  });
}

function groupVisualRows(lines: ParsedLine[]): VisualRow[] {
  const sortedLines = [...lines].sort(
    (left, right) =>
      getFrameCenterY(left.frame) - getFrameCenterY(right.frame) ||
      left.frame.left - right.frame.left,
  );
  const medianHeight =
    [...sortedLines]
      .map((line) => line.frame.height)
      .sort((left, right) => left - right)[
      Math.floor(sortedLines.length / 2)
    ] ?? 40;
  const rows: ParsedLine[][] = [];

  for (const line of sortedLines) {
    const centerY = getFrameCenterY(line.frame);
    const row = rows.find((candidate) => {
      const rowFrame = mergeFrames(candidate.map((item) => item.frame));
      const rowCenterY = getFrameCenterY(rowFrame);
      const tolerance = Math.max(
        medianHeight * 0.65,
        Math.min(rowFrame.height, line.frame.height) * 0.7,
      );

      return Math.abs(centerY - rowCenterY) <= tolerance;
    });

    if (row) {
      row.push(line);
    } else {
      rows.push([line]);
    }
  }

  return rows
    .map((rowLines) => {
      const sortedRowLines = [...rowLines].sort(
        (left, right) =>
          left.frame.left - right.frame.left ||
          left.blockIndex - right.blockIndex ||
          left.lineIndex - right.lineIndex,
      );
      const frame = mergeFrames(sortedRowLines.map((line) => line.frame));

      return {
        frame,
        lines: sortedRowLines,
        text: normalizeOcrText(
          sortedRowLines.map((line) => line.text).join(" "),
        ),
      };
    })
    .sort(
      (left, right) =>
        getFrameCenterY(left.frame) - getFrameCenterY(right.frame) ||
        left.frame.left - right.frame.left,
    );
}

function getRawText(rows: VisualRow[]) {
  return rows.map((row) => row.text).join("\n");
}

function getAllText(rows: VisualRow[]) {
  return getRawText(rows);
}

function getMoneyMatches(line: string): PriceMatch[] {
  return [...line.matchAll(MONEY_AMOUNT_GLOBAL_RE)]
    .map((match) => {
      const raw = match[0];
      const index = match.index ?? 0;
      const suffix = line.slice(index + raw.length, index + raw.length + 8);
      const vatCode = suffix.match(/\b([A-Z])\b/)?.[1];

      return {
        amount: parseReceiptMoney(raw),
        raw,
        index,
        vatCode,
      };
    })
    .filter((match) => isPlausibleReceiptAmount(match.amount));
}

function isPlausibleReceiptAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0 && amount < RECEIPT_MAX_AMOUNT;
}

function hasTotalKeyword(text: string) {
  return /\b(summe|total|gesamt(?:betrag)?|betrag|zu\s+zahlen|brutto|amount|balance|due)\b/i.test(
    text,
  );
}

function hasPaymentKeyword(text: string) {
  return /\b(bar|cash|visa|mastercard|maestro|girocard|ec[-\s]?karte|debit|credit|karte|payment|zahlung)\b/i.test(
    text,
  );
}

function hasChangeOrTenderKeyword(text: string) {
  return /\b(geg\.?|gegeben|ruckgeld|rueckgeld|change|tendered|zurueck)\b/i.test(
    text,
  );
}

function isTaxOrReceiptMetaLine(text: string) {
  return /\b(mwst|ust|vat|steuer|netto|brutto|satz|tax|uid|ust[-\s]?id|telefon|phone|terminal|trace|beleg|bon[-\s]?nr|kasse|bed\.?|markt|serial|signatur|aid|tid|mid|payback|karten[-\s]?nr)\b/i.test(
    text,
  );
}

function isDateLikeLine(text: string) {
  return /\b\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*(?:\d{2}|20\d{2})\b|\b20\d{2}\s*-\s*\d{2}\s*-\s*\d{2}\b|\b\d{1,2}:\d{2}\b/.test(
    text,
  );
}

function parseStoreName(rows: VisualRow[]) {
  const text = getAllText(rows);

  if (/\bREWE\b/i.test(text)) return "REWE";
  if (/\bLIDL\b/i.test(text)) return "LIDL";
  if (/\bALDI\b/i.test(text)) return "ALDI";
  if (/\bEDEKA\b/i.test(text)) return "EDEKA";
  if (/\bKAUFLAND\b/i.test(text)) return "Kaufland";
  if (/\bNETTO\b/i.test(text)) return "Netto";
  if (/\bPENNY\b/i.test(text)) return "Penny";
  if (/\bROSSMANN\b/i.test(text)) return "ROSSMANN";
  if (/\bdm\b|dm-drogerie/i.test(text)) return "dm-drogerie markt";

  const topRows = rows.slice(0, 8);
  const candidate = topRows.find((row) => {
    const value = row.text.trim();

    return (
      value.length >= 2 &&
      value.length <= 40 &&
      /\p{L}/u.test(value) &&
      !MONEY_AMOUNT_RE.test(value) &&
      !/^\d{5}\b/.test(value) &&
      !/telefon|phone|uid|ust|strasse|str\.|road|street/i.test(value)
    );
  });

  return candidate?.text ?? "";
}

function parseAddress(rows: VisualRow[]) {
  const postalCodeIndex = rows.findIndex((row) =>
    /^\d{5}\s+\p{L}/u.test(row.text),
  );
  if (postalCodeIndex < 0) return undefined;

  const addressRows: string[] = [];
  const previousRow = rows[postalCodeIndex - 1];

  if (
    previousRow &&
    /\p{L}/u.test(previousRow.text) &&
    /\d/.test(previousRow.text) &&
    !MONEY_AMOUNT_RE.test(previousRow.text)
  ) {
    addressRows.push(previousRow.text);
  }

  addressRows.push(rows[postalCodeIndex].text);

  return addressRows.length ? addressRows : undefined;
}

function normalizeDatePart(value: string) {
  return value
    .replace(/[Oo]/g, "0")
    .replace(/[Il]/g, "1")
    .replace(/[bB]/g, "6")
    .replace(/[Dd]/g, "0");
}

function toReceiptDate(
  dayValue: string,
  monthValue: string,
  yearValue: string,
) {
  const day = Number(normalizeDatePart(dayValue));
  const month = Number(normalizeDatePart(monthValue));
  const rawYear = normalizeDatePart(yearValue);
  const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return [
    String(day).padStart(2, "0"),
    String(month).padStart(2, "0"),
    String(year),
  ].join(".");
}

function parseReceiptDate(text: string) {
  const europeanDateMatches = [
    ...text.matchAll(
      /\b([0-3]?\d)\s*[./-]\s*([01]?\d)\s*[./-]\s*((?:20)?\d{2})\b/g,
    ),
  ];

  for (const match of europeanDateMatches) {
    const date = toReceiptDate(match[1], match[2], match[3]);
    if (date) return date;
  }

  const spacedDateMatch = text.match(/\b([0-3]?\d)\s+([01]?\d)\s+(20\d{2})\b/);
  if (spacedDateMatch) {
    return toReceiptDate(
      spacedDateMatch[1],
      spacedDateMatch[2],
      spacedDateMatch[3],
    );
  }

  const isoDateMatch = text.match(/\b(20\d{2})\s*-\s*(\d{2})\s*-\s*(\d{2})\b/);
  if (isoDateMatch) {
    return toReceiptDate(isoDateMatch[3], isoDateMatch[2], isoDateMatch[1]);
  }

  return "";
}

function parsePaymentMethod(text: string) {
  if (/master\s*card|mastercard/i.test(text)) return "Mastercard";
  if (/visa|v1sa/i.test(text)) return "Visa";
  if (/bar|cash/i.test(text)) return "Cash";
  if (
    /ec[-\s]?cash|girocard|maestro|debit|karte|contactless|kontaktlos/i.test(
      text,
    )
  ) {
    return "Debit";
  }

  return "";
}

function parseCardLast4(text: string) {
  const cardMatch =
    text.match(/(?:\*|x|#){2,}\s*(\d{4})\b/i) ??
    text.match(/\b(?:card|karte|pan)\D{0,16}(\d{4})\b/i);

  return cardMatch?.[1] ?? "";
}

function parseTotalAmount(rows: VisualRow[]) {
  const scoredAmounts = rows.flatMap((row, index) => {
    const context = [
      rows[index - 1]?.text ?? "",
      row.text,
      rows[index + 1]?.text ?? "",
    ].join(" ");

    return getMoneyMatches(row.text).map((match) => {
      let score = match.amount;

      if (hasTotalKeyword(row.text)) score += 240;
      if (hasTotalKeyword(context)) score += 170;
      if (hasPaymentKeyword(row.text)) score += 35;
      if (hasPaymentKeyword(context)) score += 20;
      if (hasChangeOrTenderKeyword(row.text)) score -= 180;
      if (hasChangeOrTenderKeyword(context)) score -= 80;
      if (isTaxOrReceiptMetaLine(row.text)) score -= 95;
      if (isDateLikeLine(row.text)) score -= 120;
      if (/%/.test(row.text)) score -= 50;
      if (/\b[A-Z]\s*\*?\s*$/.test(row.text) && !hasTotalKeyword(context)) {
        score -= 55;
      }

      return {
        amount: match.amount,
        score,
      };
    });
  });
  const bestMatch = scoredAmounts.sort(
    (left, right) => right.score - left.score || right.amount - left.amount,
  )[0];

  if (bestMatch && bestMatch.score > bestMatch.amount + 50) {
    return bestMatch.amount;
  }

  const cleanAmounts = rows.flatMap((row) => {
    if (
      hasChangeOrTenderKeyword(row.text) ||
      isTaxOrReceiptMetaLine(row.text) ||
      isDateLikeLine(row.text) ||
      /%/.test(row.text)
    ) {
      return [];
    }

    return getMoneyMatches(row.text).map((match) => match.amount);
  });

  return cleanAmounts.length ? Math.max(...cleanAmounts) : 0;
}

function getVatRateForCode(vatCode?: string) {
  if (/^A$/i.test(vatCode ?? "")) return 7;
  if (/^B$/i.test(vatCode ?? "")) return 19;
  return null;
}

function buildVatFromItems(items: ReceiptItem[]) {
  const grossByRate = new Map<number, number>();

  for (const item of items) {
    const rate = getVatRateForCode(item.vatCode);
    if (rate === null) continue;

    grossByRate.set(rate, round2((grossByRate.get(rate) ?? 0) + item.price));
  }

  return [...grossByRate.entries()].map(([rate, gross]) => {
    const net = round2(gross / (1 + rate / 100));

    return {
      rate,
      net,
      tax: round2(gross - net),
    };
  });
}

function isQuantityDetailRow(text: string) {
  return /^\s*\d+(?:[,.]\d+)?\s*(?:stk|st\.?|pcs?|x)\b/i.test(text);
}

function parseQuantityDetail(text: string) {
  const pieceMatch = text.match(
    new RegExp(
      `^\\s*(\\d+(?:[,.]\\d+)?)\\s*(?:stk|st\\.?|pcs?)?\\s*x?\\s*(${MONEY_AMOUNT})`,
      "i",
    ),
  );

  if (pieceMatch) {
    return {
      quantity: parseReceiptMoney(pieceMatch[1]),
      unitPrice: parseReceiptMoney(pieceMatch[2]),
    };
  }

  const weightMatch = text.match(
    new RegExp(`^\\s*(\\d+(?:[,.]\\d+)?)\\s*kg\\s*x\\s*(${MONEY_AMOUNT})`, "i"),
  );

  if (weightMatch) {
    return {
      weightKg: parseReceiptMoney(weightMatch[1]),
      unitPrice: parseReceiptMoney(weightMatch[2]),
    };
  }

  return null;
}

function isLikelyItemName(name: string) {
  return (
    name.length >= 2 &&
    /\p{L}/u.test(name) &&
    !hasTotalKeyword(name) &&
    !hasPaymentKeyword(name) &&
    !hasChangeOrTenderKeyword(name) &&
    !isTaxOrReceiptMetaLine(name) &&
    !isDateLikeLine(name) &&
    !/^(eur|euro|summe|total|bon|markt|kasse|bed\.?)$/i.test(name)
  );
}

function cleanItemName(value: string) {
  return value
    .replace(/\bEUR\b/gi, "")
    .replace(/\bEURO\b/gi, "")
    .replace(new RegExp(MONEY_AMOUNT, "g"), "")
    .replace(/\b[A-Z]\s*\*?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItems(rows: VisualRow[], total: number) {
  const items: ReceiptItem[] = [];
  const totalRowIndex = rows.findIndex((row) => hasTotalKeyword(row.text));
  const itemRows = rows.slice(
    0,
    totalRowIndex >= 0 ? totalRowIndex : undefined,
  );

  for (const row of itemRows) {
    const quantityDetail = parseQuantityDetail(row.text);
    if (quantityDetail && items.length) {
      const previousItem = items[items.length - 1];
      previousItem.quantity = quantityDetail.quantity;
      previousItem.weightKg = quantityDetail.weightKg;
      previousItem.unitPrice = quantityDetail.unitPrice;
      continue;
    }

    const matches = getMoneyMatches(row.text);
    if (!matches.length) continue;

    const priceMatch = matches[matches.length - 1];
    if (
      Math.abs(priceMatch.amount - total) < 0.01 &&
      (hasTotalKeyword(row.text) || matches.length === 1)
    ) {
      continue;
    }

    const name = cleanItemName(row.text.slice(0, priceMatch.index));
    if (!isLikelyItemName(name) || isQuantityDetailRow(name)) continue;

    items.push({
      name,
      price: priceMatch.amount,
      vatCode: priceMatch.vatCode,
    });
  }

  return items;
}

export function parseReceiptBlocks(
  blocks: ReceiptOcrBlock[],
): ReceiptParseResult {
  const lines = flattenBlockLines(blocks);
  const rows = groupVisualRows(lines);
  const rawText = getRawText(rows);
  const normalizedText = normalizeOcrText(rawText);
  const total = parseTotalAmount(rows);
  const items = parseItems(rows, total);

  return {
    store: parseStoreName(rows),
    address: parseAddress(rows),
    date: parseReceiptDate(normalizedText),
    total:
      total > 0
        ? total
        : round2(items.reduce((sum, item) => sum + item.price, 0)),
    paymentMethod: parsePaymentMethod(normalizedText),
    cardLast4: parseCardLast4(normalizedText),
    itemCount: items.length,
    items,
    vat: buildVatFromItems(items),
    rawText,
  };
}
