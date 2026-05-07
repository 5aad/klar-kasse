import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteMonthlyBudget,
  getCurrentMonthKey,
  getMonthlyBudget,
  getMonthlyBudgets,
  saveMonthlyBudget,
  type SaveMonthlyBudgetInput,
} from "@/api/budgets";
import { categoryQueryKeys } from "@/queries/categories";
import { receiptQueryKeys } from "@/queries/receipts";

export const budgetQueryKeys = {
  allMonthly: ["monthly-budgets"] as const,
  monthly: (monthKey: string) => ["monthly-budget", monthKey] as const,
};

export function useMonthlyBudgetsQuery() {
  return useQuery({
    queryKey: budgetQueryKeys.allMonthly,
    queryFn: getMonthlyBudgets,
  });
}

export function useMonthlyBudgetQuery(monthKey = getCurrentMonthKey()) {
  return useQuery({
    queryKey: budgetQueryKeys.monthly(monthKey),
    queryFn: () => getMonthlyBudget(monthKey),
  });
}

export function useSaveMonthlyBudgetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveMonthlyBudgetInput) => saveMonthlyBudget(input),
    onSuccess: (monthlyBudget, input) => {
      const monthKey = input.monthKey ?? getCurrentMonthKey();

      queryClient.setQueryData(budgetQueryKeys.monthly(monthKey), monthlyBudget);
      queryClient.invalidateQueries({
        queryKey: budgetQueryKeys.monthly(monthKey),
      });
      queryClient.invalidateQueries({ queryKey: budgetQueryKeys.allMonthly });
    },
  });
}

export function useDeleteMonthlyBudgetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (monthKey: string) => deleteMonthlyBudget(monthKey),
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKeys.allMonthly });

      if (budget) {
        queryClient.invalidateQueries({
          queryKey: budgetQueryKeys.monthly(budget.monthKey),
        });
      }

      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptQueryKeys.all });
    },
  });
}
