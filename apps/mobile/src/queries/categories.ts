import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  editCategory,
  getCategories,
  getCategory,
  postCategory,
  type EditCategoryInput,
  type PostCategoryInput,
} from "@/api/categories";

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
    },
  });
}
