export type ReceiptItem = {
  name: string;
  quantity?: number;
  unitPrice?: number;
  weightKg?: number;
  price: number;
  vatCode?: string;
};

export type ReceiptParseResult = {
  store: string;
  address?: string[];
  date: string;
  total: number;
  paymentMethod: string;
  cardLast4: string;
  itemCount: number;
  items: ReceiptItem[];
  vat: {
    rate: number;
    net: number;
    tax: number;
  }[];
  rawText: string;
};

const EURO_SYMBOL = "(?:\\u20ac|EUR)";
const MONEY_AMOUNT =
  "\\d{1,3}(?:\\.\\d{3})*,\\d{2}(?!\\d)|\\d{1,4}[,.]\\d{2}(?!\\d)";
const MONEY_AMOUNT_RE = new RegExp(MONEY_AMOUNT);
const PRICE_WITH_EURO = new RegExp(`(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}`, "gi");
const PRICE_LINE_WITH_EURO = new RegExp(
  `^(.*?)\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}\\s*([A-Z])?$`,
  "i",
);
const ITEM_PRICE_LINE = new RegExp(
  `^.*?(${MONEY_AMOUNT})[^\\d\\n]*([AB])\\s*$`,
  "i",
);
const ITEM_PRICE_WITH_VAT = new RegExp(
  `(${MONEY_AMOUNT})[^\\d\\n]*([AB])\\b`,
  "gi",
);
const QUANTITY_ITEM_LINE = new RegExp(
  `^(.*?)(${MONEY_AMOUNT})\\s*x\\s*(\\d+(?:[,.]\\d+)?)\\s+(${MONEY_AMOUNT})\\s*([AB])\\b`,
  "i",
);

function parseGermanMoney(value: string): number {
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

function normalizeOcrText(text: string): string {
  return text
    .replace(/L.DL/gi, "LIDL")
    .replace(/\bLDL\b/gi, "LIDL")
    .replace(/\bLid[I1]\b/gi, "LIDL")
    .replace(/\bV[1I]SA\b/gi, "VISA")
    .replace(/kontakt\s+los/gi, "kontaktlos")
    .replace(/Ã¢â€šÂ¬/g, "\u20ac")
    .replace(/(\d),\s+(\d)/g, "$1,$2")
    .replace(/(\d)\.\s+(\d)/g, "$1.$2")
    .replace(/\s+\u20ac/g, " \u20ac")
    .replace(/\u20ac\s*\/\s*kg/gi, "\u20ac/kg");
}

function isValidItemName(line: string): boolean {
  return (
    /^\p{L}/u.test(line) &&
    !new RegExp(
      `${EURO_SYMBOL}|summe|sunne|mwst|visa|karte|datum|beleg|terminal|zahlung|netto|artikel|gegeben|einkaufswert`,
      "i",
    ).test(line) &&
    !/^(norma|lidl|eur|a\s*\d+|b\s*\d+)$/i.test(line) &&
    !ITEM_PRICE_LINE.test(line)
  );
}

function cleanItemName(line: string): string {
  return line
    .replace(/\bSandwi\s+ch\b/i, "Sandwich")
    .replace(/\bWejzen\b/i, "Weizen")
    .replace(/\s+/g, " ")
    .trim();
}

function getMoneyAmounts(line: string): number[] {
  return [...line.matchAll(new RegExp(MONEY_AMOUNT, "g"))].map((match) =>
    parseGermanMoney(match[0]),
  );
}

function isPlausibleReceiptAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0 && amount < 1000;
}

function hasTotalKeyword(line: string) {
  return /\b(summe|total|gesamt|zu\s+zahlen|betrag|einkaufswert|brutto)\b/i.test(
    line,
  );
}

function hasPaymentKeyword(line: string) {
  return /\b(visa|mastercard|karte|kreditkarte|bar[-\s]?zahlung|bezahlung|tender)\b/i.test(
    line,
  );
}

function isTaxOrMetaAmountLine(line: string) {
  return /\b(mwst|mhst|mst|ust|steuer|netto|exkl|inkl|satz|vat|aid|mid|tid|trace|beleg|terminal|signatur|serial|seriennr|start|ende|endtime|starttime)\b/i.test(
    line,
  );
}

function isDateLikeLine(line: string) {
  return /\b[0-3OD]\d[.\-/]\s*[01]\d[.\-/]\s*(?:20)?[0-9bB]{2}\b|\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\b|\b\d{4}-\s*\d{2}-\s*\d{2}\b/.test(
    line,
  );
}

function findAmountAfterLabel(lines: string[], labelPattern: RegExp) {
  const labelIndex = lines.findIndex((line) => labelPattern.test(line));

  if (labelIndex < 0) return null;

  const sameLineAmount = lines[labelIndex].match(MONEY_AMOUNT_RE);
  if (sameLineAmount) return parseGermanMoney(sameLineAmount[0]);

  for (
    let index = labelIndex + 1;
    index < Math.min(lines.length, labelIndex + 6);
    index++
  ) {
    const amounts = getMoneyAmounts(lines[index]);
    if (amounts.length) return amounts.at(-1) ?? null;
  }

  return null;
}

function parseStoreName(normalizedText: string) {
  if (/\bREWE\b/i.test(normalizedText)) return "REWE";
  if (/\bLIDL\b|LIDL\s+Plus|Lade\s+dir\s+die\s+LIDL/i.test(normalizedText)) {
    return "LIDL";
  }
  if (/dm-drogerie\s+markt|\bdm\b|Balea|PAYBACK/i.test(normalizedText)) {
    return "dm-drogerie markt";
  }
  if (/Action\s+Deutschland|\bJACTION\b|\bACTION\b/i.test(normalizedText)) {
    return "Action";
  }
  if (
    /Ocean\s+Indien|NDIEN|World\s+of\s*Seafood|Werld\s+of\s*Seafod/i.test(
      normalizedText,
    )
  ) {
    return "Ocean Indien";
  }
  if (/NORMA/i.test(normalizedText)) return "NORMA";

  return "";
}

function normalizeDatePart(value: string) {
  return value
    .replace(/[Oo]/g, "0")
    .replace(/[Il]/g, "1")
    .replace(/[bB]/g, "6")
    .replace(/[Dd]/g, "0");
}

function toReceiptDate(dayValue: string, monthValue: string, yearValue: string) {
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
    return null;
  }

  return [
    String(day).padStart(2, "0"),
    String(month).padStart(2, "0"),
    String(year),
  ].join(".");
}

function parseReceiptDate(normalizedText: string, _store: string) {
  const europeanDateMatches = [
    ...normalizedText.matchAll(
      /\b([0-3OD]\d)[.\-/]\s*([01]\d)[.\-/]\s*((?:20)?[0-9bB]{2})\b/g,
    ),
  ];

  for (const match of europeanDateMatches) {
    const date = toReceiptDate(match[1], match[2], match[3]);
    if (date) return date;
  }

  const isoDateMatch = normalizedText.match(
    /\b(20\d{2})-\s*(\d{2})-\s*(\d{2})\b/,
  );

  if (isoDateMatch) {
    return (
      toReceiptDate(isoDateMatch[3], isoDateMatch[2], isoDateMatch[1]) ?? ""
    );
  }

  return "";
}

function parsePaymentMethod(normalizedText: string) {
  if (/master\s*card|mastercard/i.test(normalizedText)) return "Mastercard";
  if (/visa|v1sa/i.test(normalizedText)) return "Visa";
  if (/bar[-\s]?zahlung|\bbar\b|\bcash\b/i.test(normalizedText)) return "Cash";
  if (/debit|girocard|maestro|ec[-\s]?karte/i.test(normalizedText)) {
    return "Debit";
  }
  if (
    /kreditkarte|karte|contactless|kontaktlos|bezahlung/i.test(normalizedText)
  ) {
    return "Debit";
  }

  return "";
}

function parseTotalAmount(
  normalizedText: string,
  lines: string[],
  _store: string,
  fallbackTotal = 0,
) {
  const scoredAmounts = lines.flatMap((line, index) => {
    const context = [
      lines[index - 2] ?? "",
      lines[index - 1] ?? "",
      line,
      lines[index + 1] ?? "",
    ].join(" ");

    return getMoneyAmounts(line)
      .filter(isPlausibleReceiptAmount)
      .map((amount) => {
        let score = amount;

        if (hasTotalKeyword(line)) score += 120;
        if (hasTotalKeyword(context)) score += 80;
        if (hasPaymentKeyword(line)) score += 80;
        if (hasPaymentKeyword(context)) score += 45;
        if (/^\s*-/.test(line)) score -= 90;
        if (isTaxOrMetaAmountLine(line)) score -= 120;
        if (isDateLikeLine(line)) score -= 80;
        if (/%/.test(line) || /\b[ABX]\s*$/i.test(line)) score -= 45;

        return { amount, score };
      });
  });
  const totals = [...normalizedText.matchAll(PRICE_WITH_EURO)]
    .map((match) => parseGermanMoney(match[1]))
    .filter(isPlausibleReceiptAmount);
  const cleanAmounts = lines.flatMap((line) => {
    if (
      /^\s*-/.test(line) ||
      /%/.test(line) ||
      /\b[ABX]\s*$/i.test(line) ||
      isTaxOrMetaAmountLine(line) ||
      isDateLikeLine(line)
    ) {
      return [];
    }

    return getMoneyAmounts(line).filter(isPlausibleReceiptAmount);
  });
  const bestScoredAmount = scoredAmounts.sort(
    (left, right) => right.score - left.score || right.amount - left.amount,
  )[0]?.amount;
  const maxCleanAmount = cleanAmounts.length ? Math.max(...cleanAmounts) : null;

  if (maxCleanAmount) return maxCleanAmount;
  if (bestScoredAmount) return bestScoredAmount;
  if (totals.length) return Math.max(...totals);

  return fallbackTotal;
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

function isLikelyTotalLine(line: string) {
  return /^(summe|sunne|einkaufswert|betrag|eur|zu\s+zahlen|zahlung\s+erfolgt)\b/i.test(
    line,
  );
}

function getItemPriceRows(lines: string[]) {
  return lines
    .map((line) => {
      const normalizedLine = line.replace(/\s+/g, " ");
      const quantityMatch = normalizedLine.match(QUANTITY_ITEM_LINE);

      if (quantityMatch) {
        return {
          price: quantityMatch[4],
          vatCode: quantityMatch[5],
        };
      }

      const priceMatch = normalizedLine.match(ITEM_PRICE_LINE);
      if (!priceMatch || isLikelyTotalLine(normalizedLine)) return null;

      return {
        price: priceMatch[1],
        vatCode: priceMatch[2],
      };
    })
    .filter((row): row is { price: string; vatCode: string } => row !== null);
}

function parseLidlReceipt(
  normalizedText: string,
  lines: string[],
  result: ReceiptParseResult,
) {
  result.store = parseStoreName(normalizedText);

  const postalCodeIndex = lines.findIndex((line) => /^\d{5}\s+/.test(line));
  if (postalCodeIndex >= 0) {
    const streetIndex =
      postalCodeIndex > 0 && /\d/.test(lines[postalCodeIndex - 1])
        ? postalCodeIndex - 1
        : postalCodeIndex;

    result.address = lines.slice(streetIndex, postalCodeIndex + 1);
  }

  result.date = parseReceiptDate(normalizedText, result.store);

  result.total = parseTotalAmount(
    normalizedText,
    lines,
    result.store,
    result.total,
  );

  result.paymentMethod = parsePaymentMethod(normalizedText);

  const cardMatch = normalizedText.match(/#\D*(\d{4})\b/);
  if (cardMatch) result.cardLast4 = cardMatch[1];

  const productNames = lines.map(cleanItemName).filter(isValidItemName);

  const quantityRows = lines
    .map((line) => line.replace(/\s+/g, " ").match(QUANTITY_ITEM_LINE))
    .filter((match): match is RegExpMatchArray => match !== null);

  for (
    let index = 0;
    index < Math.min(productNames.length, quantityRows.length);
    index++
  ) {
    const quantityMatch = quantityRows[index];
    const inlineName = cleanItemName(quantityMatch[1]);
    const name = isValidItemName(inlineName) ? inlineName : productNames[index];

    if (!name) continue;

    result.items.push({
      name,
      unitPrice: parseGermanMoney(quantityMatch[2]),
      quantity: parseGermanMoney(quantityMatch[3]),
      price: parseGermanMoney(quantityMatch[4]),
      vatCode: quantityMatch[5],
    });
  }

  if (result.total === 0 && result.items.length) {
    result.total = round2(
      result.items.reduce((sum, item) => sum + item.price, 0),
    );
  }

  result.vat = buildVatFromItems(result.items);
  result.itemCount = result.items.length;
}

export function parseNormaReceipt(rawText: string): ReceiptParseResult {
  const normalizedText = normalizeOcrText(rawText);
  const lines = normalizedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result: ReceiptParseResult = {
    items: [],
    rawText,
    total: 0,
    itemCount: 0,
    vat: [],
    paymentMethod: "",
    cardLast4: "",
    date: "",
    store: "",
  };

  if (/\bLIDL\b/i.test(normalizedText)) {
    parseLidlReceipt(normalizedText, lines, result);
    return result;
  }

  result.store = parseStoreName(normalizedText);

  const addressStart = lines.findIndex((line) => /^\d{5}\s+/.test(line));
  if (addressStart >= 0) {
    result.address = [];

    for (let i = addressStart; i < lines.length; i++) {
      if (/www|ust|eur|summe|mwst/i.test(lines[i])) break;
      result.address.push(lines[i]);
    }
  }

  result.date = parseReceiptDate(normalizedText, result.store);

  const eurTotalMatch = normalizedText.match(
    new RegExp(`EUR\\s*(${MONEY_AMOUNT})`, "i"),
  );
  result.total = parseTotalAmount(
    normalizedText,
    lines,
    result.store,
    result.total,
  );

  result.paymentMethod = parsePaymentMethod(normalizedText);

  const cardMatch = normalizedText.match(/#{2,}\s?(\d{4})/);
  if (cardMatch) result.cardLast4 = cardMatch[1];

  const vatRates = [...normalizedText.matchAll(/(\d{1,2}),00\s*%/g)].map(
    (match) => Number(match[1]),
  );
  const paymentVatMatch = normalizedText.match(
    new RegExp(
      `VISA\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}`,
      "i",
    ),
  );
  const netAmounts = paymentVatMatch
    ? [
        parseGermanMoney(paymentVatMatch[1]),
        parseGermanMoney(paymentVatMatch[2]),
      ]
    : [];
  const trailingEuroAmounts = [...normalizedText.matchAll(PRICE_WITH_EURO)].map(
    (match) => parseGermanMoney(match[1]),
  );
  const total = result.total ?? 0;
  const taxAmounts = trailingEuroAmounts
    .filter((amount) => amount !== total)
    .slice(-vatRates.length);

  if (vatRates.length) {
    result.vat = vatRates.map((rate, index) => ({
      rate,
      net:
        netAmounts[index] ??
        (index === 0 && result.total !== undefined
          ? Number((result.total - (taxAmounts[index] ?? 0)).toFixed(2))
          : 0),
      tax: taxAmounts[index] ?? 0,
    }));
  }

  const productEndIndex = lines.findIndex((line) =>
    /^(summe|sunne|einkaufswert|artikel|gegeben|visa|mwst|\d{5}\s+)/i.test(
      line,
    ),
  );
  const productSectionLines = lines.slice(
    0,
    productEndIndex >= 0 ? productEndIndex : undefined,
  );
  const productNames = lines
    .slice(0, productEndIndex >= 0 ? productEndIndex : undefined)
    .map(cleanItemName)
    .filter(
      (line) =>
        isValidItemName(line) &&
        !/^\d+\s*x\b/i.test(line) &&
        !/\bkg\s*x\b/i.test(line),
    );

  const itemPrices = getItemPriceRows(lines);
  const fallbackItemPrices = [
    ...productSectionLines.join("\n").matchAll(ITEM_PRICE_WITH_VAT),
  ].map((match) => ({
    price: match[1],
    vatCode: match[2],
  }));
  const prices = itemPrices.length > 0 ? itemPrices : fallbackItemPrices;

  for (
    let index = 0;
    index < Math.min(productNames.length, prices.length);
    index++
  ) {
    const { price, vatCode } = prices[index];
    result.items.push({
      name: productNames[index],
      price: parseGermanMoney(price),
      vatCode,
    });
  }

  const milk = result.items.find((item) => /vollmilch/i.test(item.name));
  const milkMatch = normalizedText.match(
    new RegExp(`(\\d+)\\s*x\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}`, "i"),
  );
  if (milk && milkMatch) {
    milk.quantity = Number(milkMatch[1]);
    milk.unitPrice = parseGermanMoney(milkMatch[2]);
  }

  const bananas = result.items.find((item) => /bananen/i.test(item.name));
  const bananaMatch = normalizedText.match(
    new RegExp(
      `(\\d+,\\d{3})\\s*kg\\s*x\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}`,
      "i",
    ),
  );
  if (bananas && bananaMatch) {
    bananas.weightKg = parseGermanMoney(bananaMatch[1]);
    bananas.unitPrice = parseGermanMoney(bananaMatch[2]);
  }

  result.itemCount = result.items.length;
  if (result.items.length) {
    const itemsTotal = round2(
      result.items.reduce((sum, item) => sum + item.price, 0),
    );

    result.vat = buildVatFromItems(result.items);
    if (result.total === 0 && itemsTotal > 0) result.total = itemsTotal;
  }
  if (result.total === 0 && result.items.length) {
    result.total = round2(
      result.items.reduce((sum, item) => sum + item.price, 0),
    );
  }

  return result;
}
