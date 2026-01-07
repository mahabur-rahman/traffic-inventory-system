import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDrops, getMyReservations, purchaseDrop, reserveDrop } from "../api/drops";
import type { DropsListResponse } from "../types/drop";

export const dropsKey = ["drops"] as const;
export const myReservationsKey = ["reservations", "me"] as const;

export function useDropsQuery() {
  return useQuery({
    queryKey: dropsKey,
    queryFn: getDrops
  });
}

export function useMyReservationsQuery() {
  return useQuery({
    queryKey: myReservationsKey,
    queryFn: getMyReservations
  });
}

export function useReserveDropMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dropId: string) => reserveDrop(dropId),
    onSuccess: async (data, dropId) => {
      queryClient.setQueryData<DropsListResponse>(dropsKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((d) => (d.id === dropId ? { ...d, available_stock: data.drop.available_stock } : d))
        };
      });

      queryClient.setQueryData(myReservationsKey, (prev: any) => {
        const items = Array.isArray(prev?.items) ? prev.items : [];
        const nextItems = items.filter((r: any) => r.drop_id !== dropId);
        nextItems.unshift(data.reservation);
        return { items: nextItems };
      });

      await queryClient.invalidateQueries({ queryKey: dropsKey });
    }
  });
}

export function usePurchaseDropMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dropId: string) => purchaseDrop(dropId),
    onSuccess: async (_data, dropId) => {
      queryClient.setQueryData(myReservationsKey, (prev: any) => {
        const items = Array.isArray(prev?.items) ? prev.items : [];
        return { items: items.filter((r: any) => r.drop_id !== dropId) };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    }
  });
}

