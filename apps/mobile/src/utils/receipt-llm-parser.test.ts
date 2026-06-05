import assert from "node:assert/strict";
import test from "node:test";

import type { ReceiptOcrBlock } from "./receipt-block-parser";
import {
  buildReceiptLlmInput,
  buildReceiptLlmPrompt,
  parseReceiptWithLlmFallback,
} from "./receipt-llm-parser";

const frame = (top: number, left: number, width = 100, height = 20) => ({
  top,
  left,
  width,
  height,
});

const receiptBlocks: ReceiptOcrBlock[] = [
  {
    text: "Klar Markt",
    frame: frame(10, 10, 120),
    lines: [
      {
        text: "Klar Markt",
        frame: frame(10, 10, 120),
        elements: [{ text: "Klar Markt", frame: frame(10, 10, 120) }],
      },
    ],
    recognizedLanguages: [{ languageCode: "de" }],
  },
  {
    text: "MILCH 1,29 A",
    frame: frame(50, 10, 200),
    lines: [
      {
        text: "MILCH",
        frame: frame(50, 10, 80),
        elements: [{ text: "MILCH", frame: frame(50, 10, 80) }],
      },
      {
        text: "1,29 A",
        frame: frame(50, 170, 60),
        elements: [
          { text: "1,29", frame: frame(50, 170, 45) },
          { text: "A", frame: frame(50, 220, 10) },
        ],
      },
    ],
  },
  {
    text: "BROT 1,00 B",
    frame: frame(70, 10, 200),
    lines: [
      {
        text: "BROT",
        frame: frame(70, 10, 80),
        elements: [{ text: "BROT", frame: frame(70, 10, 80) }],
      },
      {
        text: "1,00 B",
        frame: frame(70, 170, 60),
        elements: [
          { text: "1,00", frame: frame(70, 170, 45) },
          { text: "B", frame: frame(70, 220, 10) },
        ],
      },
    ],
  },
  {
    text: "SUMME 2,29",
    frame: frame(90, 10, 200),
    lines: [
      {
        text: "SUMME",
        frame: frame(90, 10, 80),
        elements: [{ text: "SUMME", frame: frame(90, 10, 80) }],
      },
      {
        text: "2,29",
        frame: frame(90, 170, 45),
        elements: [{ text: "2,29", frame: frame(90, 170, 45) }],
      },
    ],
  },
];

test("builds a compact block prompt for receipt JSON extraction", () => {
  const prompt = buildReceiptLlmPrompt(receiptBlocks);

  assert.match(prompt, /Return only valid JSON/i);
  assert.match(prompt, /"lines"/);
  assert.match(prompt, /"MILCH 1,29 A"/);
  assert.match(prompt, /VAT code/i);
  assert.match(prompt, /A, B, C, 1, 2, or 3/);
  assert.match(prompt, /immediately after the item price/i);
  assert.match(prompt, /store name/i);
  assert.match(prompt, /website/i);
  assert.doesNotMatch(prompt, /"blocks"/);
  assert.doesNotMatch(prompt, /"text"/);
  assert.doesNotMatch(prompt, /"frame"/);
  assert.doesNotMatch(prompt, /quantity/);
  assert.doesNotMatch(prompt, /unitPrice/);
  assert.doesNotMatch(prompt, /weightKg/);
  assert.doesNotMatch(prompt, /recognizedLanguages/);
  assert.doesNotMatch(prompt, /cornerPoints/);
  assert.doesNotMatch(prompt, /elements/);
});

test("builds LLM input as ordered text lines without frame data", () => {
  assert.deepEqual(buildReceiptLlmInput(receiptBlocks), {
    lines: ["Klar Markt", "MILCH 1,29 A", "BROT 1,00 B", "SUMME 2,29"],
  });
});

test("uses valid LLM JSON while preserving compact OCR blocks", async () => {
  const result = await parseReceiptWithLlmFallback(receiptBlocks, async () =>
    [
      "```json",
      JSON.stringify({
        store: "Klar Markt",
        address: ["Beispielstrasse 1", "10115 Berlin"],
        date: "05.06.2026",
        total: 1.29,
        paymentMethod: "Cash",
        cardLast4: "",
        items: [{ name: "MILCH", price: 1.29, vatCode: "A" }],
        vat: [{ rate: 7, net: 1.21, tax: 0.08 }],
      }),
      "```",
    ].join("\n"),
  );

  assert.equal(result.store, "Klar Markt");
  assert.equal(result.date, "05.06.2026");
  assert.equal(result.total, 1.29);
  assert.equal(result.paymentMethod, "Cash");
  assert.equal(result.itemCount, 1);
  assert.deepEqual(result.items, [
    { name: "MILCH", price: 1.29, vatCode: "A" },
  ]);
  assert.equal(
    result.rawText,
    "Klar Markt\nMILCH 1,29 A\nBROT 1,00 B\nSUMME 2,29",
  );
  assert.deepEqual(
    result.blocks.map((line) => line.text),
    ["Klar Markt", "MILCH 1,29 A", "BROT 1,00 B", "SUMME 2,29"],
  );
});

test("falls back to the block parser when LLM output is invalid", async () => {
  const fallbackReasons: string[] = [];
  const result = await parseReceiptWithLlmFallback(
    receiptBlocks,
    async () => "not json",
    (reason) => {
      fallbackReasons.push(reason);
    },
  );

  assert.deepEqual(fallbackReasons, ["invalid_model_output"]);
  assert.equal(result.store, "Klar Markt");
  assert.equal(result.total, 2.29);
  assert.equal(result.itemCount, 2);
  assert.deepEqual(result.items, [
    { name: "MILCH", price: 1.29, vatCode: "A" },
    { name: "BROT", price: 1, vatCode: "B" },
  ]);
});
