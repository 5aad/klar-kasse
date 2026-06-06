export type ReceiptLlmJobStatus = "pending" | "processing" | "done" | "failed";
export const RECEIPT_LLM_MAX_JOB_ATTEMPTS = 3;

export function shouldEnqueueReceiptLlmJob(rawText?: string | null) {
  return Boolean(rawText?.trim());
}

export function getReceiptLlmJobLines(rawText: string) {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getReceiptLlmEngineLabel(
  status: ReceiptLlmJobStatus | null | undefined,
) {
  if (status === "pending") return "AI queued";
  if (status === "processing") return "AI improving";
  if (status === "done") return "AI improved";
  if (status === "failed") return "Using parser";

  return null;
}

export function getReceiptLlmFailureStatus(attemptCount: number) {
  return attemptCount < RECEIPT_LLM_MAX_JOB_ATTEMPTS ? "pending" : "failed";
}
