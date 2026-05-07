import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentMonthKey,
  getMonthlyBudget,
  saveMonthlyBudget,
  type SaveMonthlyBudgetInput,
} from "@/api/budgets";

export const budgetQueryKeys = {
  monthly: (monthKey: string) => ["monthly-budget", monthKey] as const,
};

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
    },
  });
}
