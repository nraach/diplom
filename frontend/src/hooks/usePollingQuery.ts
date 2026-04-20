import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { POLLING_INTERVAL_MS } from "../utils/constants";

export function usePollingQuery<TData>(
  options: Omit<UseQueryOptions<TData, Error, TData>, "refetchInterval"> & {
    refetchInterval?: number | false;
  }
) {
  return useQuery({
    ...options,
    refetchInterval: options.refetchInterval ?? POLLING_INTERVAL_MS
  });
}
