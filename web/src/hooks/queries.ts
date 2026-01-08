import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cancelReservation, createDrop, getDrops, getMyReservations, purchaseDrop, reserveDrop } from "../api";
import { notifyError, notifySuccess } from "../lib/notify";
import type { DropsListResponse } from "../types/drop";
import type { ReservationsMeResponse } from "../types/reservation";
import { ApiError } from "../types/api";
import { useAppSelector } from "../store/hooks";

export const dropsKey = ["drops"] as const;
export const myReservationsKey = ["reservations", "me"] as const;

export function useDropsQuery() {
  return useQuery({
    queryKey: dropsKey,
    queryFn: getDrops
  });
}

export function useMyReservationsQuery() {
  const userId = useAppSelector((s) => s.session.userId);
  return useQuery({
    queryKey: myReservationsKey,
    queryFn: getMyReservations,
    enabled: Boolean(userId)
  });
}

export function useDrops() {
  return useDropsQuery();
}

export function useMyReservations() {
  return useMyReservationsQuery();
}

export function useMyReservationsByDropId() {
  const q = useMyReservationsQuery();
  const byDropId = useMemo(() => {
    const map: Record<string, (ReservationsMeResponse["items"][number])> = {};
    for (const r of q.data?.items ?? []) {
      if (r.drop_id) map[r.drop_id] = r;
    }
    return map;
  }, [q.data]);
  return { ...q, byDropId };
}

export function useReserveDropMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dropId: string) => reserveDrop(dropId),
    onSuccess: async (data, dropId) => {
      notifySuccess("Reserved");

      queryClient.setQueryData<DropsListResponse>(dropsKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((d) => (d.id === dropId ? { ...d, available_stock: data.drop.available_stock } : d))
        };
      });

      queryClient.setQueryData(myReservationsKey, (prev: any) => {
        const typed = prev as ReservationsMeResponse | undefined;
        const items = typed?.items ?? [];
        const nextItems = items.filter((r) => r.drop_id !== dropId);
        nextItems.unshift(data.reservation);
        return { items: nextItems } satisfies ReservationsMeResponse;
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    },
    onError: (err) => {
      notifyError(err);
      void queryClient.invalidateQueries({ queryKey: dropsKey });
    }
  });
}

export function usePurchaseDropMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dropId: string) => {
      const cached = queryClient.getQueryData<ReservationsMeResponse>(myReservationsKey);
      const now = Date.now();
      const r = cached?.items?.find(
        (x) => x.drop_id === dropId && x.expires_at && new Date(x.expires_at).getTime() > now
      );
      if (!r) {
        throw new ApiError({
          code: "RESERVATION_REQUIRED",
          status: 409,
          message: "You must reserve before purchase"
        });
      }
      return purchaseDrop(dropId);
    },
    onSuccess: async (_data, dropId) => {
      notifySuccess("Purchased");

      queryClient.setQueryData(myReservationsKey, (prev: any) => {
        const typed = prev as ReservationsMeResponse | undefined;
        const items = typed?.items ?? [];
        return { items: items.filter((r) => r.drop_id !== dropId) } satisfies ReservationsMeResponse;
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    },
    onError: (err) => {
      notifyError(err);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    }
  });
}

export function useReserveDrop() {
  return useReserveDropMutation();
}

export function usePurchaseDrop() {
  return usePurchaseDropMutation();
}

// Prompt aliases
export const useReserveMutation = useReserveDropMutation;
export const usePurchaseMutation = usePurchaseDropMutation;

export function useCancelReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => cancelReservation(reservationId),
    onSuccess: async (data) => {
      notifySuccess("Cancelled");

      queryClient.setQueryData(myReservationsKey, (prev: any) => {
        const typed = prev as ReservationsMeResponse | undefined;
        const items = typed?.items ?? [];
        return { items: items.filter((r) => r.id !== data.reservationId) } satisfies ReservationsMeResponse;
      });

      if (data.availableStock !== null) {
        queryClient.setQueryData<DropsListResponse>(dropsKey, (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((d) =>
              d.id === data.dropId ? { ...d, available_stock: data.availableStock ?? d.available_stock } : d
            )
          };
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    },
    onError: (err) => {
      notifyError(err);
      void queryClient.invalidateQueries({ queryKey: myReservationsKey });
    }
  });
}

export function useCreateDropMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof createDrop>[0]) => createDrop(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dropsKey });
    },
    onError: (err) => {
      notifyError(err);
    }
  });
}
