export type ReceiptItem = {
  name: string;
  quantity?: number;
  unitPrice?: number;
  weightKg?: number;
  price: number;
  vatCode?: string;
};

export type CompactReceiptOcrFrame = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type CompactReceiptOcrLine = {
  text: string;
  frame: CompactReceiptOcrFrame;
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
  blocks: CompactReceiptOcrLine[];
};
