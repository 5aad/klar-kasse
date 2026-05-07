import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
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

      if (receipt) {
        queryClient.setQueryData(receiptQueryKeys.detail(receipt.id), receipt);
      }
    },
  });
}
