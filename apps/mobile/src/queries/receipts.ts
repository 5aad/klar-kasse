import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteReceipt,
  getReceipt,
  getReceipts,
  postReceipt,
  type PostReceiptInput,
} from "@/api/receipts";

export const receiptQueryKeys = {
  all: ["receipts"] as const,
  detail: (id: string) => ["receipts", id] as const,
};

export function useReceiptsQuery() {
  return useQuery({
    queryKey: receiptQueryKeys.all,
    queryFn: getReceipts,
  });
}

export function useReceiptQuery(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: receiptQueryKeys.detail(id),
    queryFn: () => getReceipt(id),
  });
}

export function usePostReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostReceiptInput) => postReceipt(input),
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: receiptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      if (receipt) {
        queryClient.setQueryData(receiptQueryKeys.detail(receipt.id), receipt);
      }
    },
  });
}

export function useDeleteReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReceipt(id),
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: receiptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      if (receipt) {
        queryClient.removeQueries({
          queryKey: receiptQueryKeys.detail(receipt.id),
        });
      }
    },
  });
}
