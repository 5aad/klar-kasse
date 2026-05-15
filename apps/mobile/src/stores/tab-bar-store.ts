import { create } from "zustand";

type TabBarState = {
  isMinimized: boolean;
  setIsMinimized: (isMinimized: boolean) => void;
};

export const useTabBarStore = create<TabBarState>((set) => ({
  isMinimized: false,
  setIsMinimized: (isMinimized) => set({ isMinimized }),
}));
