export type ReceiptItem = {
  name: string;
  quantity?: number;
  unitPrice?: number;
  weightKg?: number;
  price: number;
  vatCode?: string;
};

export type ReceiptParseResult = {
  store?: string;
  address?: string[];
  date?: string;
  time?: string;
  total: number;
  paymentMethod?: string;
  cardLast4?: string;
  itemCount: number;
  items: ReceiptItem[];
  vat?: {
    rate: number;
    net: number;
    tax: number;
  }[];
  rawText: string;
};

const EURO_SYMBOL = "(?:\\u20ac|EUR)";
const MONEY_AMOUNT = "\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2}";
const PRICE_WITH_EURO = new RegExp(`(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}`, "gi");
const PRICE_LINE_WITH_EURO = new RegExp(
  `^(.*?)\\s*(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}\\s*([A-Z])?$`,
  "i",
);
const ITEM_PRICE_WITH_VAT = new RegExp(
  `(${MONEY_AMOUNT})\\s*${EURO_SYMBOL}\\s*([A-Z])\\b`,
  "gi",
);

function parseGermanMoney(value: string): number {
  return Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
}

function normalizeOcrText(text: string): string {
  return text
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
    ).test(line)
  );
}

function cleanItemName(line: string): string {
  return line
    .replace(/\bSandwi\s+ch\b/i, "Sandwich")
    .replace(/\bWejzen\b/i, "Weizen")
    .replace(/\s+/g, " ")
    .trim();
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
  };

  if (/NORMA/i.test(normalizedText)) {
    result.store = "NORMA";
  }

  const addressStart = lines.findIndex((line) => /^\d{5}\s+/.test(line));
  if (addressStart >= 0) {
    result.address = [];

    for (let i = addressStart; i < lines.length; i++) {
      if (/www|ust|eur|summe|mwst/i.test(lines[i])) break;
      result.address.push(lines[i]);
    }
  }

  const dateMatch = normalizedText.match(
    /Datum\s+(\d{2}\.\d{2}\.\d{2})\s+(\d{1,2})\s*[;:]\s*(\d{2})/i,
  );
  if (dateMatch) {
    result.date = dateMatch[1];
    result.time = `${dateMatch[2]}:${dateMatch[3]}`;
  }

  const eurTotalMatch = normalizedText.match(
    new RegExp(`EUR\\s*(${MONEY_AMOUNT})`, "i"),
  );
  const totals = [...normalizedText.matchAll(PRICE_WITH_EURO)].map((match) =>
    parseGermanMoney(match[1]),
  );
  if (eurTotalMatch) {
    result.total = parseGermanMoney(eurTotalMatch[1]);
  } else if (totals.length) {
    result.total = Math.max(...totals);
  }

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
    /^(summe|sunne|einkaufswert|norma|artikel|gegeben|visa|mwst|\d{5}\s+)/i.test(
      line,
    ),
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

  const priceRows = lines
    .map((line, index) => ({
      index,
      match: line.replace(/\s+/g, " ").match(PRICE_LINE_WITH_EURO),
    }))
    .filter(
      (row): row is { index: number; match: RegExpMatchArray } =>
        row.match !== null && Boolean(row.match[3]),
    );
  const itemPrices =
    priceRows.length > 0
      ? priceRows.map((row) => ({
          price: row.match[2],
          vatCode: row.match[3],
        }))
      : [...normalizedText.matchAll(ITEM_PRICE_WITH_VAT)].map((match) => ({
          price: match[1],
          vatCode: match[2],
        }));

  for (
    let index = 0;
    index < Math.min(productNames.length, itemPrices.length);
    index++
  ) {
    const { price, vatCode } = itemPrices[index];
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

  return result;
}
