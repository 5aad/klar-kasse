import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkBackendSupport,
  checkMultimodalSupport,
  GEMMA_4_E2B_IT,
  getRecommendedBackend,
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
  type ReceiptLlmFallbackHandler,
} from "@/utils/receipt-llm-parser";

const baseReceiptLlmConfig = {
  autoLoad: true,
  maxTokens: 4096,
  multimodal: false,
  systemPrompt: RECEIPT_LLM_SYSTEM_PROMPT,
  temperature: 0.1,
  topK: 1,
  topP: 0.1,
};

const RECEIPT_LLM_DEBUG = true;
const RECEIPT_LLM_DEBUG_TAG = "[ReceiptLLM]";

export function useReceiptLlmParser() {
  const backendSupport = useMemo(
    () => ({
      gpu: formatBackendSupport(checkBackendSupport("gpu")),
      npu: formatBackendSupport(checkBackendSupport("npu")),
      recommended: getRecommendedBackend(),
    }),
    [],
  );
  const [backend, setBackend] = useState<ReceiptLlmBackend>(() =>
    getAvailableReceiptLlmBackend(checkBackendSupport),
  );
  const multimodalError = useMemo(() => checkMultimodalSupport(), []);
  const receiptLlmConfig = useMemo(
    () => ({
      ...baseReceiptLlmConfig,
      backend,
    }),
    [backend],
  );
  const llm = useModel(GEMMA_4_E2B_IT, receiptLlmConfig);

  useEffect(() => {
    debugReceiptLlm("backend availability", {
      ...backendSupport,
      selected: backend,
      multimodal: multimodalError ?? "supported",
    });
  }, [backend, backendSupport, multimodalError]);

  useEffect(() => {
    debugReceiptLlm("model lifecycle", {
      modelUrl: GEMMA_4_E2B_IT,
      backend,
      downloadProgress: llm.downloadProgress,
      downloaded: llm.downloadProgress >= 1,
      isReady: llm.isReady,
      isGenerating: llm.isGenerating,
      error: llm.error,
      memorySummary: llm.memorySummary,
    });
  }, [
    backend,
    llm.downloadProgress,
    llm.error,
    llm.isGenerating,
    llm.isReady,
    llm.memorySummary,
  ]);

  useEffect(() => {
    setBackend((currentBackend) =>
      getNextReceiptLlmBackend(currentBackend, llm.error),
    );
  }, [llm.error]);

  const parseBlocks = useCallback(
    async (
      blocks: ReceiptOcrBlock[],
      onFallback?: ReceiptLlmFallbackHandler,
    ) => {
      debugReceiptLlm("parse request", {
        backend,
        blockCount: blocks.length,
        canUseModel: llm.isReady,
        isGenerating: llm.isGenerating,
      });

      const result = await parseReceiptWithLlmFallback(
        blocks,
        llm.isReady ? llm.generate : null,
        onFallback,
      );

      debugReceiptLlm("parse result returned to screen", result);

      return result;
    },
    [backend, llm.generate, llm.isGenerating, llm.isReady],
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

function formatBackendSupport(warning: string | undefined) {
  return warning ?? "supported";
}

function debugReceiptLlm(label: string, value: unknown) {
  if (!RECEIPT_LLM_DEBUG) return;

  console.log(`${RECEIPT_LLM_DEBUG_TAG} ${label}`, value);
}
