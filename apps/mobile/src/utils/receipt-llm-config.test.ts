import assert from "node:assert/strict";
import test from "node:test";

import {
  getAvailableReceiptLlmBackend,
  getNextReceiptLlmBackend,
  RECEIPT_LLM_FALLBACK_BACKEND,
  RECEIPT_LLM_PREFERRED_BACKEND,
} from "./receipt-llm-config";

test("selects GPU when the library reports GPU support", () => {
  assert.equal(
    getAvailableReceiptLlmBackend((backend) =>
      backend === "gpu" ? undefined : "Unavailable",
    ),
    "gpu",
  );
});

test("selects NPU when GPU is unavailable but NPU is supported", () => {
  assert.equal(
    getAvailableReceiptLlmBackend((backend) =>
      backend === "npu" ? undefined : "Unavailable",
    ),
    "npu",
  );
});

test("selects CPU when GPU and NPU are unavailable", () => {
  assert.equal(
    getAvailableReceiptLlmBackend(() => "Unavailable"),
    RECEIPT_LLM_FALLBACK_BACKEND,
  );
});

test("keeps the preferred GPU backend when there is no model error", () => {
  assert.equal(
    getNextReceiptLlmBackend(RECEIPT_LLM_PREFERRED_BACKEND, null),
    RECEIPT_LLM_PREFERRED_BACKEND,
  );
});

test("falls back from GPU to CPU when the model reports an error", () => {
  assert.equal(
    getNextReceiptLlmBackend(
      RECEIPT_LLM_PREFERRED_BACKEND,
      "GPU backend failed to initialize",
    ),
    RECEIPT_LLM_FALLBACK_BACKEND,
  );
});

test("falls back from NPU to CPU when the model reports an error", () => {
  assert.equal(
    getNextReceiptLlmBackend("npu", "NPU backend failed to initialize"),
    RECEIPT_LLM_FALLBACK_BACKEND,
  );
});

test("keeps CPU after fallback even if a later CPU error is reported", () => {
  assert.equal(
    getNextReceiptLlmBackend(RECEIPT_LLM_FALLBACK_BACKEND, "Model load failed"),
    RECEIPT_LLM_FALLBACK_BACKEND,
  );
});
