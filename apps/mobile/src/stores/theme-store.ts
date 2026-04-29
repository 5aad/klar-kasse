import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

type ThemeState = {
  themePreference: ThemePreference;
  setThemePreference: (themePreference: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themePreference: "system",
  setThemePreference: (themePreference) => set({ themePreference }),
}));
