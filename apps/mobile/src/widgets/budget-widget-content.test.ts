import assert from "node:assert/strict";
import test from "node:test";

import {
  formatBudgetWidgetAmount,
  getBudgetWidgetCopy,
} from "./budget-widget-content";

test("returns German widget labels", () => {
  const copy = getBudgetWidgetCopy("de");

  assert.equal(copy.pacingTitle, "MONATSBUDGET-VERBRAUCH");
  assert.equal(copy.usedLabel, "Verwendet");
  assert.equal(copy.ofLabel, "von");
  assert.equal(copy.noCategorySpending, "Noch keine Kategorieausgaben");
});

test("formats the saved currency symbol with the selected language", () => {
  assert.equal(formatBudgetWidgetAmount(181, "$", "en"), "$ 181");
  assert.equal(formatBudgetWidgetAmount(181, "€", "de"), "€ 181");
});
