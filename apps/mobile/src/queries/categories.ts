import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteCategory,
  editCategory,
  getCategories,
  getCategory,
  postCategory,
  type EditCategoryInput,
  type PostCategoryInput,
} from "@/api/categories";
import { requestBudgetWidgetRefresh } from "@/widgets/budget-widget-refresh";

export const categoryQueryKeys = {
  all: ["categories"] as const,
  detail: (id: string) => ["categories", id] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryQueryKeys.all,
    queryFn: getCategories,
  });
}

export function useCategoryQuery(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: categoryQueryKeys.detail(id),
    queryFn: () => getCategory(id),
  });
}

export function usePostCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostCategoryInput) => postCategory(input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });

      if (category) {
        queryClient.setQueryData(
          categoryQueryKeys.detail(category.id),
          category,
        );
      }

      void requestBudgetWidgetRefresh();
    },
  });
}

export function useEditCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditCategoryInput) => editCategory(input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });

      if (category) {
        queryClient.setQueryData(
          categoryQueryKeys.detail(category.id),
          category,
        );
      }

      void requestBudgetWidgetRefresh();
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });

      if (category) {
        queryClient.removeQueries({
          queryKey: categoryQueryKeys.detail(category.id),
        });
      }

      void requestBudgetWidgetRefresh();
    },
  });
}
