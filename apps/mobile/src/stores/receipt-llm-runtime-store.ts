import { create } from "zustand";

import type { ReceiptLlmBackend } from "@/utils/receipt-llm-config";

type ReceiptLlmRuntimeState = {
  backend: ReceiptLlmBackend;
  deferProcessingUntil: number;
  downloadProgress: number;
  error: string | null;
  isGenerating: boolean;
  isReady: boolean;
  remountRequestId: number;
  deferProcessing: (durationMs: number) => void;
  requestModelRemount: () => void;
  setRuntimeStatus: (
    status: Partial<
      Omit<
        ReceiptLlmRuntimeState,
        "deferProcessing" | "requestModelRemount" | "setRuntimeStatus"
      >
    >,
  ) => void;
};

export const useReceiptLlmRuntimeStore = create<ReceiptLlmRuntimeState>(
  (set) => ({
    backend: "cpu",
    deferProcessingUntil: 0,
    downloadProgress: 0,
    error: null,
    isGenerating: false,
    isReady: false,
    remountRequestId: 0,
    deferProcessing: (durationMs) =>
      set({ deferProcessingUntil: Date.now() + durationMs }),
    requestModelRemount: () =>
      set((state) => ({ remountRequestId: state.remountRequestId + 1 })),
    setRuntimeStatus: (status) => set(status),
  }),
);
