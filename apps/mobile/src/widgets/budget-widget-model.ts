export type BudgetWidgetLayout = "medium";

type MonthlyBudgetLike = {
  currency: string;
  limitAmount: number;
  spentAmount: number;
};

type CategoryLike = {
  limitAmount: number;
  name: string;
  spentAmount: number;
};

export type BudgetWidgetCategorySnapshot = {
  limitAmount: number;
  name: string;
  progressPercentage: number;
  spentAmount: number;
  spentPercentage: number;
};

export type BudgetWidgetSnapshot = {
  categories: BudgetWidgetCategorySnapshot[];
  currency: string;
  hasBudget: boolean;
  limitAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  spentAmount: number;
  spentPercentage: number;
};

function getPercentage(spentAmount: number, limitAmount: number) {
  if (limitAmount <= 0) return 0;

  return Math.max(Math.round((spentAmount / limitAmount) * 100), 0);
}

function clampProgress(percentage: number) {
  return Math.min(Math.max(percentage, 0), 100);
}

export function selectBudgetWidgetLayout(_: {
  height: number;
  width: number;
}): BudgetWidgetLayout {
  return "medium";
}

export function createBudgetWidgetSnapshot({
  categories,
  monthlyBudget,
}: {
  categories: CategoryLike[];
  monthlyBudget: MonthlyBudgetLike | null;
}): BudgetWidgetSnapshot {
  if (!monthlyBudget) {
    return {
      categories: [],
      currency: "EUR",
      hasBudget: false,
      limitAmount: 0,
      progressPercentage: 0,
      remainingAmount: 0,
      spentAmount: 0,
      spentPercentage: 0,
    };
  }

  const spentPercentage = getPercentage(
    monthlyBudget.spentAmount,
    monthlyBudget.limitAmount,
  );

  return {
    categories: categories
      .filter((category) => category.spentAmount > 0)
      .sort((left, right) => right.spentAmount - left.spentAmount)
      .slice(0, 3)
      .map((category) => {
        const categoryPercentage = getPercentage(
          category.spentAmount,
          category.limitAmount,
        );

        return {
          limitAmount: category.limitAmount,
          name: category.name,
          progressPercentage: clampProgress(categoryPercentage),
          spentAmount: category.spentAmount,
          spentPercentage: categoryPercentage,
        };
      }),
    currency: monthlyBudget.currency,
    hasBudget: true,
    limitAmount: monthlyBudget.limitAmount,
    progressPercentage: clampProgress(spentPercentage),
    remainingAmount: monthlyBudget.limitAmount - monthlyBudget.spentAmount,
    spentAmount: monthlyBudget.spentAmount,
    spentPercentage,
  };
}
