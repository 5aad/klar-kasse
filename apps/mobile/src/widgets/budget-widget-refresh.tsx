import { requestWidgetUpdate } from "react-native-android-widget";

import { getMonthlyBudget } from "@/api/budgets";
import { getCategories } from "@/api/categories";
import { getLocalUserPreferences } from "@/api/users";
import { getStoredAppLanguage } from "@/i18n/language-storage";
import { BudgetWidget } from "@/widgets/budget-widget";
import {
  createBudgetWidgetSnapshot,
  type BudgetWidgetSnapshot,
} from "@/widgets/budget-widget-model";

export const KLAR_KASSE_WIDGET_NAME = "KlarKasse";

export async function loadBudgetWidgetSnapshot() {
  const [monthlyBudget, categories, userPreferences, language] =
    await Promise.all([
      getMonthlyBudget(),
      getCategories(),
      getLocalUserPreferences(),
      getStoredAppLanguage(),
    ]);

  return createBudgetWidgetSnapshot({
    categories,
    currency: userPreferences?.currency,
    language,
    monthlyBudget,
  });
}

export function renderBudgetWidget({
  snapshot,
}: {
  snapshot: BudgetWidgetSnapshot;
}) {
  return {
    dark: <BudgetWidget snapshot={snapshot} theme="dark" />,
    light: <BudgetWidget snapshot={snapshot} theme="light" />,
  };
}

export async function requestBudgetWidgetRefresh() {
  try {
    const snapshot = await loadBudgetWidgetSnapshot();

    await requestWidgetUpdate({
      renderWidget: () => renderBudgetWidget({ snapshot }),
      widgetName: KLAR_KASSE_WIDGET_NAME,
    });
  } catch (error) {
    console.warn("Budget widget refresh failed:", error);
  }
}
