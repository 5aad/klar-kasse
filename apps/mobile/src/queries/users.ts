import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserPreferences,
  saveUserPreferences,
  type SaveUserPreferencesInput,
} from "@/api/users";

export const userQueryKeys = {
  preferences: ["user-preferences"] as const,
};

export function useUserPreferencesQuery() {
  return useQuery({
    queryKey: userQueryKeys.preferences,
    queryFn: getUserPreferences,
  });
}

export function useSaveUserPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveUserPreferencesInput) => saveUserPreferences(input),
    onSuccess: (preferences) => {
      queryClient.setQueryData(userQueryKeys.preferences, preferences);
      queryClient.invalidateQueries({ queryKey: userQueryKeys.preferences });
    },
  });
}
