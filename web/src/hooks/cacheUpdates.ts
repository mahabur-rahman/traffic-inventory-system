import type { QueryClient } from "@tanstack/react-query";

import type { DropsListResponse } from "../types/drop";
import { dropsKey, myReservationsKey } from "./queries";

export function applyStockUpdated(queryClient: QueryClient, payload: { dropId: string; availableStock: number }) {
  queryClient.setQueryData<DropsListResponse>(dropsKey, (prev) => {
    if (!prev) return prev;
    let changed = false;
    const nextItems = prev.items.map((d) => {
      if (d.id !== payload.dropId) return d;
      if (d.available_stock === payload.availableStock) return d;
      changed = true;
      return { ...d, available_stock: payload.availableStock };
    });
    return changed ? { ...prev, items: nextItems } : prev;
  });
}

export function applyActivityUpdated(
  queryClient: QueryClient,
  payload: {
    dropId: string;
    latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
  }
) {
  queryClient.setQueryData<DropsListResponse>(dropsKey, (prev) => {
    if (!prev) return prev;
    const nextItems = prev.items.map((d) => {
      if (d.id !== payload.dropId) return d;
      return {
        ...d,
        activity_feed: {
          latest_purchasers: payload.latestPurchasers.map((p) => ({
            user_id: p.userId,
            username: p.username,
            qty: p.qty,
            created_at: p.createdAt
          }))
        }
      };
    });
    return { ...prev, items: nextItems };
  });
}

export function removeReservationById(queryClient: QueryClient, reservationId: string) {
  queryClient.setQueryData(myReservationsKey, (prev: any) => {
    const items = Array.isArray(prev?.items) ? prev.items : [];
    return { items: items.filter((r: any) => r.id !== reservationId) };
  });
}

