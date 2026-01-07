import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "../types/api";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          if (error instanceof ApiError) return error.code === "NETWORK_ERROR";
          return false;
        },
        refetchOnWindowFocus: false
      }
    }
  });
}
