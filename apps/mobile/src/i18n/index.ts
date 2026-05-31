import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import de from "@/i18n/locales/de.json";
import en from "@/i18n/locales/en.json";
import {
  getDeviceLanguage,
  getStoredAppLanguage,
  isSupportedLanguage,
  saveStoredAppLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n/language-storage";

const fallbackLanguage: SupportedLanguage = "en";

void i18next.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
  lng: getDeviceLanguage(),
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
});

void getStoredAppLanguage().then((savedLanguage) => {
  void i18next.changeLanguage(savedLanguage);
});

export function getCurrentLanguage(): SupportedLanguage {
  const language = i18next.resolvedLanguage ?? i18next.language;
  const languageCode = language.split("-")[0]?.toLowerCase();

  return isSupportedLanguage(languageCode)
    ? (languageCode as SupportedLanguage)
    : fallbackLanguage;
}

export async function setAppLanguage(language: SupportedLanguage) {
  await saveStoredAppLanguage(language);
  await i18next.changeLanguage(language);
}

export { i18next, supportedLanguages };
export type { SupportedLanguage };
