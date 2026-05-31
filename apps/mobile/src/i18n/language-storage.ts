import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";

export const supportedLanguages = ["en", "de"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const fallbackLanguage: SupportedLanguage = "en";
const languageStorageKey = "klar-kasse-language";

export function getDeviceLanguage(): SupportedLanguage {
  const languageCode =
    Localization.getLocales()[0]?.languageCode?.toLowerCase();

  return supportedLanguages.includes(languageCode as SupportedLanguage)
    ? (languageCode as SupportedLanguage)
    : fallbackLanguage;
}

export function isSupportedLanguage(value: string | null | undefined) {
  return supportedLanguages.includes(value as SupportedLanguage);
}

export async function getStoredAppLanguage(): Promise<SupportedLanguage> {
  const savedLanguage = await SecureStore.getItemAsync(languageStorageKey);

  return isSupportedLanguage(savedLanguage)
    ? (savedLanguage as SupportedLanguage)
    : getDeviceLanguage();
}

export async function saveStoredAppLanguage(language: SupportedLanguage) {
  await SecureStore.setItemAsync(languageStorageKey, language);
}
