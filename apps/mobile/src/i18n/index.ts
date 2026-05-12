import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import de from "@/i18n/locales/de.json";
import en from "@/i18n/locales/en.json";

export const supportedLanguages = ["en", "de"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const fallbackLanguage: SupportedLanguage = "en";
const languageStorageKey = "klar-kasse-language";

function getDeviceLanguage(): SupportedLanguage {
  const languageCode = Localization.getLocales()[0]?.languageCode?.toLowerCase();

  return supportedLanguages.includes(languageCode as SupportedLanguage)
    ? (languageCode as SupportedLanguage)
    : fallbackLanguage;
}

function isSupportedLanguage(value: string | null | undefined) {
  return supportedLanguages.includes(value as SupportedLanguage);
}

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

void SecureStore.getItemAsync(languageStorageKey).then((savedLanguage) => {
  if (isSupportedLanguage(savedLanguage)) {
    void i18next.changeLanguage(savedLanguage as SupportedLanguage);
  }
});

export function getCurrentLanguage(): SupportedLanguage {
  const language = i18next.resolvedLanguage ?? i18next.language;
  const languageCode = language.split("-")[0]?.toLowerCase();

  return isSupportedLanguage(languageCode)
    ? (languageCode as SupportedLanguage)
    : fallbackLanguage;
}

export async function setAppLanguage(language: SupportedLanguage) {
  await SecureStore.setItemAsync(languageStorageKey, language);
  await i18next.changeLanguage(language);
}

export { i18next };
