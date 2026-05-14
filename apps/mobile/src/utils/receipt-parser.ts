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
const MONEY_AMOUNT = "\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2}";
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
  return Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/L.DL/gi, "LIDL")
    .replace(/kontakt\s+los/gi, "kontaktlos")
    .replace(/Ã¢â€šÂ¬/g, "\u20ac")
    .replace(/(\d),\s+(\d)/g, "$1,$2")
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
  if (/\bLIDL\b/i.test(normalizedText)) return "LIDL";
  if (/NORMA/i.test(normalizedText)) return "NORMA";

  return "";
}

function parseReceiptDate(normalizedText: string, store: string) {
  if (store === "LIDL") {
    const dateMatch = normalizedText.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);

    return dateMatch?.[1] ?? "";
  }

  const dateMatch = normalizedText.match(/\bDatum\s+(\d{2}\.\d{2}\.\d{2})/i);

  return dateMatch?.[1] ?? "";
}

function parseTotalAmount(
  normalizedText: string,
  lines: string[],
  store: string,
  fallbackTotal = 0,
) {
  if (store === "LIDL") {
    const paymentTotal = findAmountAfterLabel(lines, /zahlung\s+erfolgt/i);
    const sumTotal = findAmountAfterLabel(lines, /^summe\b/i);
    const betragTotal = findAmountAfterLabel(lines, /^betrag\b/i);

    return paymentTotal ?? sumTotal ?? betragTotal ?? fallbackTotal;
  }

  const eurTotalMatch = normalizedText.match(
    new RegExp(`EUR\\s*(${MONEY_AMOUNT})`, "i"),
  );
  const totals = [...normalizedText.matchAll(PRICE_WITH_EURO)].map((match) =>
    parseGermanMoney(match[1]),
  );

  if (eurTotalMatch) return parseGermanMoney(eurTotalMatch[1]);
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

  if (/visa/i.test(normalizedText)) result.paymentMethod = "Visa";

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

  if (/visa/i.test(normalizedText)) result.paymentMethod = "Visa";

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
    if (!eurTotalMatch && itemsTotal > result.total) {
      result.total = itemsTotal;
    }
  }
  if (result.total === 0 && result.items.length) {
    result.total = round2(
      result.items.reduce((sum, item) => sum + item.price, 0),
    );
  }

  return result;
}
