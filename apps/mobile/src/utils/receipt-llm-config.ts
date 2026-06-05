export type ReceiptLlmBackend = "cpu" | "gpu" | "npu";
type BackendSupportChecker = (backend: "gpu" | "npu") => string | undefined;

export const RECEIPT_LLM_PREFERRED_BACKEND: ReceiptLlmBackend = "gpu";
export const RECEIPT_LLM_FALLBACK_BACKEND: ReceiptLlmBackend = "cpu";

export function getAvailableReceiptLlmBackend(
  checkBackendSupport: BackendSupportChecker,
): ReceiptLlmBackend {
  if (!checkBackendSupport("gpu")) return "gpu";
  if (!checkBackendSupport("npu")) return "npu";

  return RECEIPT_LLM_FALLBACK_BACKEND;
}

export function getNextReceiptLlmBackend(
  currentBackend: ReceiptLlmBackend,
  error: string | null,
): ReceiptLlmBackend {
  if (currentBackend !== RECEIPT_LLM_FALLBACK_BACKEND && error) {
    return RECEIPT_LLM_FALLBACK_BACKEND;
  }

  return currentBackend;
}
