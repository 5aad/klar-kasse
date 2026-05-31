import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import {
  loadBudgetWidgetSnapshot,
  renderBudgetWidget,
} from "@/widgets/budget-widget-refresh";
import { createBudgetWidgetSnapshot } from "@/widgets/budget-widget-model";

const renderActions = new Set(["WIDGET_ADDED", "WIDGET_UPDATE"]);

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (!renderActions.has(props.widgetAction)) return;

  try {
    const snapshot = await loadBudgetWidgetSnapshot();

    props.renderWidget(renderBudgetWidget({ snapshot }));
  } catch (error) {
    console.warn("Budget widget render failed:", error);
    props.renderWidget(
      renderBudgetWidget({
        snapshot: createBudgetWidgetSnapshot({
          categories: [],
          monthlyBudget: null,
        }),
      }),
    );
  }
}
