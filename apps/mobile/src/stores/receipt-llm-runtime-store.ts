import { create } from "zustand";

import type { ReceiptLlmBackend } from "@/utils/receipt-llm-config";

type ReceiptLlmRuntimeState = {
  backend: ReceiptLlmBackend;
  downloadProgress: number;
  error: string | null;
  isGenerating: boolean;
  isReady: boolean;
  setRuntimeStatus: (
    status: Partial<Omit<ReceiptLlmRuntimeState, "setRuntimeStatus">>,
  ) => void;
};

export const useReceiptLlmRuntimeStore = create<ReceiptLlmRuntimeState>(
  (set) => ({
    backend: "cpu",
    downloadProgress: 0,
    error: null,
    isGenerating: false,
    isReady: false,
    setRuntimeStatus: (status) => set(status),
  }),
);
