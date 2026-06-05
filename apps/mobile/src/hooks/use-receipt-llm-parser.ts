import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkBackendSupport,
  checkMultimodalSupport,
  GEMMA_4_E2B_IT,
  useModel,
} from "react-native-litert-lm";

import type { ReceiptOcrBlock } from "@/utils/receipt-block-parser";
import {
  getAvailableReceiptLlmBackend,
  getNextReceiptLlmBackend,
  type ReceiptLlmBackend,
} from "@/utils/receipt-llm-config";
import {
  parseReceiptWithLlmFallback,
  RECEIPT_LLM_SYSTEM_PROMPT,
} from "@/utils/receipt-llm-parser";

const baseReceiptLlmConfig = {
  autoLoad: true,
  maxTokens: 1200,
  multimodal: false,
  systemPrompt: RECEIPT_LLM_SYSTEM_PROMPT,
  temperature: 0.1,
  topK: 1,
  topP: 0.1,
};

export function useReceiptLlmParser() {
  const [backend, setBackend] = useState<ReceiptLlmBackend>(() =>
    getAvailableReceiptLlmBackend(checkBackendSupport),
  );
  const multimodalError = checkMultimodalSupport();
  const receiptLlmConfig = useMemo(
    () => ({
      ...baseReceiptLlmConfig,
      backend,
    }),
    [backend],
  );
  const llm = useModel(GEMMA_4_E2B_IT, receiptLlmConfig);

  useEffect(() => {
    setBackend((currentBackend) =>
      getNextReceiptLlmBackend(currentBackend, llm.error),
    );
  }, [llm.error]);

  const parseBlocks = useCallback(
    (blocks: ReceiptOcrBlock[]) =>
      parseReceiptWithLlmFallback(blocks, llm.isReady ? llm.generate : null),
    [llm.generate, llm.isReady],
  );

  return {
    downloadProgress: llm.downloadProgress,
    backend,
    error: llm.error ?? multimodalError ?? null,
    isGenerating: llm.isGenerating,
    isReady: llm.isReady,
    parseBlocks,
  };
}
