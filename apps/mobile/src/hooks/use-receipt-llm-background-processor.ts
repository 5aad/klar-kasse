import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkBackendSupport,
  checkMultimodalSupport,
  GEMMA_4_E2B_IT,
  getRecommendedBackend,
  useModel,
} from "react-native-litert-lm";

import {
  processNextReceiptLlmJob,
  resetInterruptedReceiptLlmJobs,
} from "@/api/receipt-llm-jobs";
import {
  getAvailableReceiptLlmBackend,
  getNextReceiptLlmBackend,
  type ReceiptLlmBackend,
} from "@/utils/receipt-llm-config";
import { RECEIPT_LLM_SYSTEM_PROMPT } from "@/utils/receipt-llm-parser";
import { queryClient } from "@/lib/query-client";
import { receiptQueryKeys } from "@/queries/receipts";
import { useReceiptLlmRuntimeStore } from "@/stores/receipt-llm-runtime-store";
import { requestBudgetWidgetRefresh } from "@/widgets/budget-widget-refresh";

const receiptLlmBackgroundConfig = {
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

function debugReceiptLlm(label: string, value: unknown) {
  if (!RECEIPT_LLM_DEBUG) return;

  console.log(`${RECEIPT_LLM_DEBUG_TAG} ${label}`, value);
}

export function ReceiptLlmBackgroundProcessor() {
  const [modelInstanceKey, setModelInstanceKey] = useState(0);
  const lastRemountRequestIdRef = useRef<number | null>(null);
  const remountRequestId = useReceiptLlmRuntimeStore(
    (state) => state.remountRequestId,
  );
  const handleModelUnavailable = useCallback(() => {
    setModelInstanceKey((currentKey) => currentKey + 1);
  }, []);

  useEffect(() => {
    if (lastRemountRequestIdRef.current === null) {
      lastRemountRequestIdRef.current = remountRequestId;
      return;
    }

    if (lastRemountRequestIdRef.current === remountRequestId) return;

    lastRemountRequestIdRef.current = remountRequestId;
    debugReceiptLlm("background model instance remount requested", {
      reason: "explicit_request",
    });
    setModelInstanceKey((currentKey) => currentKey + 1);
  }, [remountRequestId]);

  return createElement(ReceiptLlmBackgroundProcessorInstance, {
    key: modelInstanceKey,
    onModelUnavailable: handleModelUnavailable,
  });
}

function ReceiptLlmBackgroundProcessorInstance({
  onModelUnavailable,
}: {
  onModelUnavailable: () => void;
}) {
  useReceiptLlmBackgroundProcessor(onModelUnavailable);

  return null;
}

export function useReceiptLlmBackgroundProcessor(
  onModelUnavailable?: () => void,
) {
  const isProcessingRef = useRef(false);
  const deferProcessingUntil = useReceiptLlmRuntimeStore(
    (state) => state.deferProcessingUntil,
  );
  const setRuntimeStatus = useReceiptLlmRuntimeStore(
    (state) => state.setRuntimeStatus,
  );
  const backendSupport = useMemo(
    () => ({
      gpu: checkBackendSupport("gpu") ?? "supported",
      npu: checkBackendSupport("npu") ?? "supported",
      recommended: getRecommendedBackend(),
    }),
    [],
  );
  const multimodalError = useMemo(() => checkMultimodalSupport(), []);
  const [backend, setBackend] = useState<ReceiptLlmBackend>(() =>
    getAvailableReceiptLlmBackend(checkBackendSupport),
  );
  const llm = useModel(GEMMA_4_E2B_IT, {
    ...receiptLlmBackgroundConfig,
    backend,
  });
  const generateReceiptJson = useCallback(
    async (prompt: string) => {
      return llm.generate(prompt);
    },
    [llm.generate],
  );

  useEffect(() => {
    debugReceiptLlm("background backend availability", {
      ...backendSupport,
      selected: backend,
      multimodal: multimodalError ?? "supported",
    });
  }, [backend, backendSupport, multimodalError]);

  useEffect(() => {
    setRuntimeStatus({
      backend,
      downloadProgress: llm.downloadProgress,
      error: llm.error,
      isGenerating: llm.isGenerating,
      isReady: llm.isReady,
    });

    debugReceiptLlm("background model lifecycle", {
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
    setRuntimeStatus,
  ]);

  useEffect(() => {
    resetInterruptedReceiptLlmJobs();
  }, []);

  useEffect(() => {
    setBackend((currentBackend) =>
      getNextReceiptLlmBackend(currentBackend, llm.error),
    );
  }, [llm.error]);

  useEffect(() => {
    if (!llm.isReady || llm.error) return;

    let isCancelled = false;

    async function refreshReceiptState() {
      await queryClient.invalidateQueries({
        queryKey: receiptQueryKeys.all,
      });
      await queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      await queryClient.invalidateQueries({
        queryKey: ["monthly-budgets"],
      });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      void requestBudgetWidgetRefresh();
    }

    async function processQueue() {
      if (isProcessingRef.current) return;
      if (Date.now() < deferProcessingUntil) {
        debugReceiptLlm("background queue deferred", {
          remainingMs: deferProcessingUntil - Date.now(),
        });
        return;
      }

      isProcessingRef.current = true;

      try {
        while (!isCancelled) {
          const didProcessJob = await processNextReceiptLlmJob(
            generateReceiptJson,
            refreshReceiptState,
            () => {
              debugReceiptLlm("background model instance remount requested", {
                backend,
              });
              useReceiptLlmRuntimeStore
                .getState()
                .deferProcessing(8000);
              onModelUnavailable?.();
            },
          );
          if (!didProcessJob) break;

          await refreshReceiptState();
        }
      } finally {
        isProcessingRef.current = false;
      }
    }

    const startupTimeoutId = setTimeout(processQueue, 3000);
    const intervalId = setInterval(processQueue, 5000);

    return () => {
      isCancelled = true;
      clearTimeout(startupTimeoutId);
      clearInterval(intervalId);
    };
  }, [deferProcessingUntil, generateReceiptJson, llm.error, llm.isReady]);

  return {
    backend,
    downloadProgress: llm.downloadProgress,
    error: llm.error,
    isGenerating: llm.isGenerating,
    isReady: llm.isReady,
  };
}
