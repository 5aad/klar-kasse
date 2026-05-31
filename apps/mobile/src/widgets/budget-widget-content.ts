import type { SupportedLanguage } from "@/i18n/language-storage";

const widgetCopy = {
  de: {
    emptyBody: "Oeffne Klar Kasse, um ein Monatslimit festzulegen.",
    emptyTitle: "Ausgaben im Blick behalten",
    noCategorySpending: "Noch keine Kategorieausgaben",
    pacingTitle: "MONATSBUDGET-VERBRAUCH",
    setBudgetTitle: "MONATSBUDGET FESTLEGEN",
    usedLabel: "Verwendet",
    ofLabel: "von",
  },
  en: {
    emptyBody: "Open Klar Kasse to add a monthly limit.",
    emptyTitle: "Start pacing your spending",
    noCategorySpending: "No category spending yet",
    pacingTitle: "MONTHLY BUDGET PACING",
    setBudgetTitle: "SET YOUR MONTHLY BUDGET",
    usedLabel: "Used",
    ofLabel: "of",
  },
} as const;

export function getBudgetWidgetCopy(language: SupportedLanguage) {
  return widgetCopy[language];
}

export function formatBudgetWidgetAmount(
  amount: number,
  currency: string,
  language: SupportedLanguage,
) {
  return `${currency} ${amount.toLocaleString(language, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}
