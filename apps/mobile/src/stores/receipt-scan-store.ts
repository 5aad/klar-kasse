import { create } from 'zustand';

type ReceiptImage = {
  uri: string;
  width: number;
  height: number;
};

type ReceiptScanState = {
  isScanScreen: boolean;
  originalImage: ReceiptImage | null;
  croppedImage: ReceiptImage | null;
  setIsScanScreen: (isScanScreen: boolean) => void;
  setReceiptImages: (images: { originalImage: ReceiptImage; croppedImage: ReceiptImage }) => void;
  clearReceiptImages: () => void;
};

export const useReceiptScanStore = create<ReceiptScanState>((set) => ({
  isScanScreen: false,
  originalImage: null,
  croppedImage: null,
  setIsScanScreen: (isScanScreen) => set({ isScanScreen }),
  setReceiptImages: ({ originalImage, croppedImage }) => set({ originalImage, croppedImage }),
  clearReceiptImages: () => set({ originalImage: null, croppedImage: null }),
}));
