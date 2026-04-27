import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fixAndValidateStructuredOutput,
  getStructuredOutputPrompt,
  QWEN3_0_6B_QUANTIZED,
  LLMModule,
  type Message,
} from "react-native-executorch";
import * as z from "zod/v4";

export const ReceiptSchema = z.object({
  store: z.string().optional(),
  address: z.array(z.string()).default([]),
  date: z.string().optional(),
  time: z.string().optional(),
  paymentMethod: z.string().optional(),
  cardLast4: z.string().optional(),
  itemCount: z.number(),
  total: z.number(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      weightKg: z.number().optional(),
      price: z.number(),
      vatCode: z.string().optional(),
    }),
  ),
  vat: z
    .array(
      z.object({
        rate: z.number(),
        net: z.number(),
        tax: z.number(),
      }),
    )
    .default([]),
});

export type ReceiptJson = z.infer<typeof ReceiptSchema>;

function buildSystemPrompt() {
  const formattingInstructions = getStructuredOutputPrompt(ReceiptSchema);

  return `
You clean German supermarket receipt OCR into valid JSON.

Rules:
- Return ONLY JSON.
- Do not invent items.
- Ignore payment terminal lines, VAT summary lines, totals, card data, and customer receipt text as items.
- Item names appear before price lines.
- Prices like "1,09 € A" are item prices.
- "2 x 0,95 €" means quantity 2, unitPrice 0.95, price 1.90.
- "0,718 kg x 1,29 €/kg" means weightKg 0.718, unitPrice 1.29.
- "EUR 6,96", "Summe", or "Einkaufswert" is total, not an item.
- Convert German decimal commas to numbers.
- Fix obvious OCR errors:
  "Sandwi ch Wejzen" -> "Sandwich Weizen"
  "Sunne" -> "Summe"
  "10; 19" -> "10:19"
  "Vollmil ch" -> "Vollmilch"
  "Kartenzahl ung" -> "Kartenzahlung"

${formattingInstructions}

/no_think
  `.trim();
}

type CleanerListener = {
  onProgress: (progress: number) => void;
  onToken: (token: string) => void;
  onMessages: (messages: Message[]) => void;
  onReady: (llm: LLMModule) => void;
  onError: (error: unknown) => void;
};

const cleanerListeners = new Set<CleanerListener>();
let sharedLlm: LLMModule | null = null;
let sharedLoadPromise: Promise<LLMModule> | null = null;
let sharedDownloadProgress = 0;
let sharedMessageHistory: Message[] = [];
let sharedResponse = "";
let sharedError: unknown = null;

function isAlreadyDownloadingError(error: unknown) {
  return String(error instanceof Error ? error.message : error).includes(
    "Already downloading this file",
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function notifyReady(llm: LLMModule) {
  for (const listener of cleanerListeners) listener.onReady(llm);
}

function notifyError(error: unknown) {
  for (const listener of cleanerListeners) listener.onError(error);
}

function notifyProgress(progress: number) {
  sharedDownloadProgress = progress;
  for (const listener of cleanerListeners) listener.onProgress(progress);
}

function notifyToken(token: string) {
  sharedResponse += token;
  for (const listener of cleanerListeners) listener.onToken(token);
}

function notifyMessages(messages: Message[]) {
  sharedMessageHistory = messages;
  for (const listener of cleanerListeners) listener.onMessages(messages);
}

function ensureReceiptCleanerLoaded(systemPrompt: string) {
  if (sharedLlm) return Promise.resolve(sharedLlm);
  if (sharedLoadPromise) return sharedLoadPromise;

  const loadWithRetry = async (attempt = 0): Promise<LLMModule> => {
    try {
      return await LLMModule.fromModelName(
        QWEN3_0_6B_QUANTIZED,
        notifyProgress,
        notifyToken,
        notifyMessages,
      );
    } catch (error) {
      if (isAlreadyDownloadingError(error) && attempt < 30) {
        await delay(2000);
        return loadWithRetry(attempt + 1);
      }

      throw error;
    }
  };

  sharedLoadPromise = loadWithRetry()
    .then((llm) => {
      llm.configure({
        chatConfig: {
          systemPrompt,
        },
        generationConfig: {
          temperature: 0,
          topp: 0.1,
        },
      });

      sharedLlm = llm;
      sharedError = null;
      notifyReady(llm);
      return llm;
    })
    .catch((error) => {
      sharedLoadPromise = null;
      sharedError = error;
      notifyError(error);
      throw error;
    });

  return sharedLoadPromise;
}

export function useReceiptJsonCleaner() {
  const [messageHistory, setMessageHistory] =
    useState<Message[]>(sharedMessageHistory);
  const [response, setResponse] = useState(sharedResponse);
  const [downloadProgress, setDownloadProgress] = useState(
    sharedDownloadProgress,
  );
  const [isReady, setIsReady] = useState(Boolean(sharedLlm));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<unknown>(sharedError);
  const systemPrompt = useMemo(buildSystemPrompt, []);

  useEffect(() => {
    const listener: CleanerListener = {
      onProgress: setDownloadProgress,
      onToken: (token) => setResponse((current) => current + token),
      onMessages: setMessageHistory,
      onReady: () => setIsReady(true),
      onError: setError,
    };

    cleanerListeners.add(listener);
    setError(null);
    ensureReceiptCleanerLoaded(systemPrompt).catch((err) => {
      setError(err);
    });

    return () => {
      cleanerListeners.delete(listener);
    };
  }, [systemPrompt]);

  const cleanReceiptJson = useCallback(async (rawText: string) => {
    const llm = sharedLlm;

    if (!llm) {
      throw new Error("LLM is not ready yet");
    }

    const prompt = `
Clean this OCR receipt into the required JSON schema:

${rawText}
    `.trim();

    sharedResponse = "";
    setResponse("");
    setIsGenerating(true);
    setError(null);

    try {
      const messages = await llm.sendMessage(prompt);
      sharedMessageHistory = messages;
      setMessageHistory(messages);
      return messages;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getCleanedJson = useCallback(() => {
    const lastMessage = messageHistory.at(-1);

    if (!lastMessage || lastMessage.role !== "assistant" || isGenerating) {
      return null;
    }

    return fixAndValidateStructuredOutput(lastMessage.content, ReceiptSchema);
  }, [isGenerating, messageHistory]);

  const interrupt = useCallback(() => {
    sharedLlm?.interrupt();
    setIsGenerating(false);
  }, []);

  return {
    cleanReceiptJson,
    getCleanedJson,
    interrupt,
    response,
    messageHistory,
    downloadProgress,
    isReady,
    isGenerating,
    error,
  };
}
