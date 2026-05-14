import { useMemo } from "react";

import { useUserPreferencesQuery } from "@/queries/users";

type FormatCurrencyOptions = {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function useCurrencyFormatter() {
  const userPreferencesQuery = useUserPreferencesQuery();
  const currency = userPreferencesQuery.data?.currency ?? "EUR";

  return useMemo(
    () => ({
      currency,
      formatCurrency(
        amount: number,
        {
          maximumFractionDigits = 2,
          minimumFractionDigits = 2,
        }: FormatCurrencyOptions = {},
      ) {
        return `${currency} ${amount.toLocaleString(undefined, {
          maximumFractionDigits,
          minimumFractionDigits,
        })}`;
      },
    }),
    [currency],
  );
}
