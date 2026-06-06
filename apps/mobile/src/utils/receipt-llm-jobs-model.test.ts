import assert from "node:assert/strict";
import test from "node:test";

import {
  getReceiptLlmEngineLabel,
  getReceiptLlmFailureStatus,
  getReceiptLlmJobLines,
  shouldEnqueueReceiptLlmJob,
} from "./receipt-llm-jobs-model";

test("enqueues LLM jobs only when raw text is available", () => {
  assert.equal(shouldEnqueueReceiptLlmJob("Store\nTotal 2,48"), true);
  assert.equal(shouldEnqueueReceiptLlmJob(""), false);
  assert.equal(shouldEnqueueReceiptLlmJob("   \n  "), false);
  assert.equal(shouldEnqueueReceiptLlmJob(undefined), false);
  assert.equal(shouldEnqueueReceiptLlmJob(null), false);
});

test("recreates ordered LLM lines from stored raw text", () => {
  assert.deepEqual(getReceiptLlmJobLines("Netto\nSUMME 2,48\nVISA"), [
    "Netto",
    "SUMME 2,48",
    "VISA",
  ]);
});

test("maps job status to receipt list engine labels", () => {
  assert.equal(getReceiptLlmEngineLabel("processing"), "AI improving");
  assert.equal(getReceiptLlmEngineLabel("pending"), "AI queued");
  assert.equal(getReceiptLlmEngineLabel("done"), "AI improved");
  assert.equal(getReceiptLlmEngineLabel("failed"), "Using parser");
  assert.equal(getReceiptLlmEngineLabel(null), null);
});

test("retries failed LLM jobs before falling back to parser status", () => {
  assert.equal(getReceiptLlmFailureStatus(1), "pending");
  assert.equal(getReceiptLlmFailureStatus(2), "pending");
  assert.equal(getReceiptLlmFailureStatus(3), "failed");
});
