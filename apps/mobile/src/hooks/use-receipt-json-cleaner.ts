import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fixAndValidateStructuredOutput,
  getStructuredOutputPrompt,
  SMOLLM2_1_360M_QUANTIZED,
  LLMModule,
  type Message,
} from "react-native-executorch";
import * as z from "zod/v4";

export const ReceiptSchema = z.object({
  store: z.string().optional(),
  address: z.array(z.string()).default([]).optional(),
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
    .default([])
    .optional(),
});

export type ReceiptJson = z.infer<typeof ReceiptSchema>;

export type ReceiptJsonWithRawText = ReceiptJson & {
  rawText?: string;
};

type CleanReceiptJsonResult = {
  source: "parser" | "llm" | "parser-fallback";
  data: ReceiptJson;
  messages: Message[];
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function getItemsTotal(receipt: ReceiptJson) {
  return round2(receipt.items.reduce((sum, item) => sum + item.price, 0));
}

function needsLLM(receipt: ReceiptJsonWithRawText) {
  const itemsTotal = getItemsTotal(receipt);

  if (!receipt.items.length) return true;
  if (receipt.itemCount !== receipt.items.length) return true;
  if (Math.abs(itemsTotal - receipt.total) > 0.01) return true;

  for (const item of receipt.items) {
    if (!item.name || item.name.trim().length < 2) return true;
    if (typeof item.price !== "number" || Number.isNaN(item.price)) return true;
  }

  return false;
}

function removeRawText(receipt: ReceiptJsonWithRawText) {
  const { rawText, ...jsonWithoutRawText } = receipt;
  return jsonWithoutRawText;
}

function buildSystemPrompt() {
  const formattingInstructions = getStructuredOutputPrompt(ReceiptSchema);

  return `
/no_think

You fix German supermarket receipt JSON.
Return ONLY JSON.
Do not explain.
Do not use markdown.
Do not invent data.
Use OCR text only as reference.
Keep item order.
Remove rawText from final output.
itemCount must equal items.length.
total must equal sum of item prices when clearly possible.
Use numbers, not strings.

${formattingInstructions}
`.trim();
}

function buildUserPrompt(receipt: ReceiptJsonWithRawText) {
  const rawText = receipt.rawText ?? "";
  const jsonWithoutRawText = removeRawText(receipt);

  return `
/no_think

Fix this parsed receipt JSON using the OCR text as reference.

Parsed JSON:
${JSON.stringify(jsonWithoutRawText)}

OCR text:
${rawText}
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
  for (const listener of cleanerListeners) {
    listener.onReady(llm);
  }
}

function notifyError(error: unknown) {
  for (const listener of cleanerListeners) {
    listener.onError(error);
  }
}

function notifyProgress(progress: number) {
  sharedDownloadProgress = progress;

  for (const listener of cleanerListeners) {
    listener.onProgress(progress);
  }
}

function notifyToken(token: string) {
  sharedResponse += token;

  for (const listener of cleanerListeners) {
    listener.onToken(token);
  }
}

function notifyMessages(messages: Message[]) {
  sharedMessageHistory = messages;

  for (const listener of cleanerListeners) {
    listener.onMessages(messages);
  }
}

function ensureReceiptCleanerLoaded(systemPrompt: string) {
  if (sharedLlm) return Promise.resolve(sharedLlm);
  if (sharedLoadPromise) return sharedLoadPromise;

  const loadWithRetry = async (attempt = 0): Promise<LLMModule> => {
    try {
      return await LLMModule.fromModelName(
        SMOLLM2_1_360M_QUANTIZED,
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

  const cleanReceiptJson = useCallback(
    async (
      receipt: ReceiptJsonWithRawText,
    ): Promise<CleanReceiptJsonResult> => {
      const parsed = ReceiptSchema.safeParse(removeRawText(receipt));

      if (parsed.success && !needsLLM(receipt)) {
        return {
          source: "parser",
          data: parsed.data,
          messages: [],
        };
      }

      const llm = sharedLlm;

      if (!llm) {
        throw new Error("LLM is not ready yet");
      }

      const prompt = buildUserPrompt(receipt);

      sharedResponse = "";
      setResponse("");
      setIsGenerating(true);
      setError(null);

      try {
        const messages = await llm.sendMessage(prompt);

        sharedMessageHistory = messages;
        setMessageHistory(messages);

        const lastMessage = messages.at(-1);

        if (!lastMessage || lastMessage.role !== "assistant") {
          throw new Error("No assistant response from LLM");
        }

        console.log("Raw receipt LLM response:", lastMessage.content);

        const fixedJson = fixAndValidateStructuredOutput(
          lastMessage.content,
          ReceiptSchema,
        );

        return {
          source: "llm",
          data: fixedJson,
          messages,
        };
      } catch (err) {
        setError(err);

        const lastMessage = sharedMessageHistory.at(-1);
        if (lastMessage?.role === "assistant") {
          console.log("Invalid receipt LLM response:", lastMessage.content);
        }

        if (parsed.success) {
          return {
            source: "parser-fallback",
            data: parsed.data,
            messages: sharedMessageHistory,
          };
        }

        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

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
