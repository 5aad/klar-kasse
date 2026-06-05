import assert from "node:assert/strict";
import test from "node:test";

import {
  compactReceiptOcrBlocks,
  parseReceiptBlocks,
  type CompactReceiptOcrLine,
  type ReceiptOcrBlock,
} from "./receipt-block-parser";

const frame = (top: number, left: number, width = 100, height = 20) => ({
  top,
  left,
  width,
  height,
});

test("compacts OCR blocks into ordered visual lines for LLM input", () => {
  const blocks: ReceiptOcrBlock[] = [
    {
      text: "SUMME\n12,45",
      frame: frame(80, 10),
      lines: [
        {
          text: "12,45",
          frame: frame(80, 180, 60),
          elements: [
            {
              text: "12,45",
              frame: frame(80, 180, 60),
            },
          ],
        },
        {
          text: "SUMME",
          frame: frame(80, 10, 70),
          elements: [
            {
              text: "SUMME",
              frame: frame(80, 10, 70),
            },
          ],
        },
      ],
      cornerPoints: [
        { x: 10, y: 80 },
        { x: 250, y: 80 },
        { x: 250, y: 100 },
        { x: 10, y: 100 },
      ],
      recognizedLanguages: [{ languageCode: "de" }],
    },
    {
      text: "MILCH",
      frame: frame(30, 10),
      lines: [
        {
          text: "MILCH",
          frame: frame(30, 10, 70),
          elements: [
            {
              text: "MILCH",
              frame: frame(30, 10, 70),
            },
          ],
          recognizedLanguages: [{ languageCode: "de" }],
        },
        {
          text: "1,29 A",
          frame: frame(30, 180, 70),
          elements: [
            {
              text: "1,29",
              frame: frame(30, 180, 50),
            },
            {
              text: "A",
              frame: frame(30, 240, 10),
            },
          ],
        },
      ],
    },
  ];

  const compactLines = compactReceiptOcrBlocks(blocks);

  assert.deepEqual(compactLines, [
    {
      text: "MILCH 1,29 A",
      frame: { top: 30, left: 10, width: 240, height: 20 },
    },
    {
      text: "SUMME 12,45",
      frame: { top: 80, left: 10, width: 230, height: 20 },
    },
  ] satisfies CompactReceiptOcrLine[]);
});

test("returns an empty receipt result when OCR returns no blocks", () => {
  const result = parseReceiptBlocks([]);

  assert.deepEqual(result, {
    store: "",
    address: undefined,
    date: "",
    total: 0,
    paymentMethod: "",
    cardLast4: "",
    itemCount: 0,
    items: [],
    vat: [],
    rawText: "",
    blocks: [],
  });
});
