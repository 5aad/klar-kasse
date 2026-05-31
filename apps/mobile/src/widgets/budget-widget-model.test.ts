import assert from "node:assert/strict";
import test from "node:test";

import {
  createBudgetWidgetSnapshot,
  selectBudgetWidgetLayout,
} from "./budget-widget-model";

test("selects medium layout for the fixed 4x2 widget", () => {
  assert.equal(selectBudgetWidgetLayout({ height: 110, width: 250 }), "medium");
});

test("keeps medium layout when launchers report slightly different dimensions", () => {
  assert.equal(selectBudgetWidgetLayout({ height: 180, width: 320 }), "medium");
});

test("keeps medium layout when launchers report extra space", () => {
  assert.equal(selectBudgetWidgetLayout({ height: 300, width: 320 }), "medium");
});

test("calculates monthly pacing and sorts categories by spending", () => {
  const snapshot = createBudgetWidgetSnapshot({
    categories: [
      { limitAmount: 300, name: "Dining", spentAmount: 120 },
      { limitAmount: 500, name: "Shopping", spentAmount: 200 },
      { limitAmount: 100, name: "Travel", spentAmount: 20 },
    ],
    monthlyBudget: {
      currency: "EUR",
      limitAmount: 1_000,
      spentAmount: 720,
    },
  });

  assert.equal(snapshot.currency, "EUR");
  assert.equal(snapshot.remainingAmount, 280);
  assert.equal(snapshot.spentAmount, 720);
  assert.equal(snapshot.spentPercentage, 72);
  assert.equal(snapshot.progressPercentage, 72);
  assert.deepEqual(
    snapshot.categories.map((category) => category.name),
    ["Shopping", "Dining", "Travel"],
  );
  assert.deepEqual(
    snapshot.categories.map((category) => category.spentPercentage),
    [40, 40, 20],
  );
});

test("clamps progress bars while preserving overspending percentages", () => {
  const snapshot = createBudgetWidgetSnapshot({
    categories: [{ limitAmount: 50, name: "Dining", spentAmount: 75 }],
    monthlyBudget: {
      currency: "EUR",
      limitAmount: 100,
      spentAmount: 125,
    },
  });

  assert.equal(snapshot.remainingAmount, -25);
  assert.equal(snapshot.spentPercentage, 125);
  assert.equal(snapshot.progressPercentage, 100);
  assert.equal(snapshot.categories[0]?.spentPercentage, 150);
  assert.equal(snapshot.categories[0]?.progressPercentage, 100);
});

test("returns an empty state when no monthly budget exists", () => {
  const snapshot = createBudgetWidgetSnapshot({
    categories: [{ limitAmount: 50, name: "Dining", spentAmount: 75 }],
    monthlyBudget: null,
  });

  assert.equal(snapshot.hasBudget, false);
  assert.equal(snapshot.currency, "EUR");
  assert.equal(snapshot.remainingAmount, 0);
  assert.equal(snapshot.spentPercentage, 0);
  assert.equal(snapshot.progressPercentage, 0);
  assert.deepEqual(snapshot.categories, []);
});
