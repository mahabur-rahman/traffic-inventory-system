import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { DropsListResponse } from "../types/drop";
import type { MyReservation } from "../types/reservation";
import { notifyInfo } from "../lib/notify";
import { normalizeError } from "../lib/errors";
import { useSocket } from "../realtime/SocketProvider";
import {
  dropsKey,
  myReservationsKey,
  useDropsQuery,
  useMyReservationsQuery,
  usePurchaseDropMutation,
  useReserveDropMutation
} from "../hooks/queries";
import { StatusBar } from "../components/StatusBar";
import { DropCard } from "../components/DropCard";
import { DropCardSkeleton } from "../components/DropCardSkeleton";
import { ErrorBanner } from "../components/ErrorBanner";

export function Dashboard() {
  const [busyDropId, setBusyDropId] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [stockFlash, setStockFlash] = useState<Record<string, boolean>>({});

  const flashTimers = useRef<Record<string, number>>({});
  const expiredNotified = useRef<Record<string, boolean>>({});

  const { socket, connectionState } = useSocket();

  const queryClient = useQueryClient();
  const dropsQuery = useDropsQuery();
  const reservationsQuery = useMyReservationsQuery();
  const reserveMutation = useReserveDropMutation();
  const purchaseMutation = usePurchaseDropMutation();

  const loading = dropsQuery.isFetching || reservationsQuery.isFetching;
  const ok =
    dropsQuery.isError || reservationsQuery.isError ? false : dropsQuery.data || reservationsQuery.data ? true : null;
  const errorMessage = (() => {
    const err = dropsQuery.error ?? reservationsQuery.error;
    if (!err) return null;
    const e = normalizeError(err);
    return `${e.title}: ${e.message}`;
  })();
  const lastUpdatedAt = useMemo(() => {
    const ts = Math.max(dropsQuery.dataUpdatedAt || 0, reservationsQuery.dataUpdatedAt || 0);
    return ts ? new Date(ts) : null;
  }, [dropsQuery.dataUpdatedAt, reservationsQuery.dataUpdatedAt]);

  const items = useMemo(() => dropsQuery.data?.items ?? [], [dropsQuery.data]);
  const reservationsByDropId = useMemo(() => {
    const map: Record<string, MyReservation> = {};
    for (const r of reservationsQuery.data?.items ?? []) {
      if (r.drop_id) map[r.drop_id] = r;
    }
    return map;
  }, [reservationsQuery.data]);

  function flashDrop(dropId: string) {
    setStockFlash((prev) => ({ ...prev, [dropId]: true }));
    const existing = flashTimers.current[dropId];
    if (existing) window.clearTimeout(existing);
    flashTimers.current[dropId] = window.setTimeout(() => {
      setStockFlash((prev) => ({ ...prev, [dropId]: false }));
      delete flashTimers.current[dropId];
    }, 650);
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dropsKey }),
      queryClient.invalidateQueries({ queryKey: myReservationsKey })
    ]);
  }

  async function reserve(dropId: string) {
    setBusyDropId(dropId);
    try {
      delete expiredNotified.current[dropId];
      await reserveMutation.mutateAsync(dropId);
      flashDrop(dropId);
    } finally {
      setBusyDropId(null);
    }
  }

  async function purchase(dropId: string) {
    setBusyDropId(dropId);
    try {
      await purchaseMutation.mutateAsync(dropId);
    } finally {
      setBusyDropId(null);
    }
  }

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    for (const [dropId, r] of Object.entries(reservationsByDropId)) {
      if (!r.expires_at) continue;
      const expiresAt = new Date(r.expires_at).getTime();
      if (Number.isNaN(expiresAt)) continue;

      if (expiresAt <= now.getTime() && !expiredNotified.current[dropId]) {
        expiredNotified.current[dropId] = true;
        notifyInfo("Reservation expired");
        void queryClient.invalidateQueries({ queryKey: myReservationsKey });
      }
    }
  }, [now]);

  useEffect(() => {
    if (!socket) return;

    const onStock = (payload: { dropId: string; availableStock: number }) => {
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
      flashDrop(payload.dropId);
    };

    const onActivity = (payload: {
      dropId: string;
      latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
    }) => {
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
    };

    const onExpired = (payload: { dropId: string; reservationId: string }) => {
      const prev = queryClient.getQueryData<any>(myReservationsKey);
      const items = Array.isArray(prev?.items) ? prev.items : [];
      const isMine = items.some((r: any) => r.id === payload.reservationId);

      queryClient.setQueryData(myReservationsKey, (p: any) => {
        const list = Array.isArray(p?.items) ? p.items : [];
        return { items: list.filter((r: any) => r.id !== payload.reservationId) };
      });

      if (isMine) {
        notifyInfo("Reservation expired");
      }
    };

    const onDropCreated = (_payload: { drop: unknown }) => {
      void refresh();
    };

    const onPurchaseCompleted = (_payload: { dropId: string; username: string | null; purchasedAt: string }) => {
      // Purchaser list is updated via ACTIVITY_UPDATED; this marks activity without refetch.
      void queryClient.invalidateQueries({ queryKey: dropsKey });
    };

    socket.on("STOCK_UPDATED", onStock);
    socket.on("ACTIVITY_UPDATED", onActivity);
    socket.on("RESERVATION_EXPIRED", onExpired);
    socket.on("PURCHASE_COMPLETED", onPurchaseCompleted);
    socket.on("DROP_CREATED", onDropCreated);

    return () => {
      socket.off("STOCK_UPDATED", onStock);
      socket.off("ACTIVITY_UPDATED", onActivity);
      socket.off("RESERVATION_EXPIRED", onExpired);
      socket.off("PURCHASE_COMPLETED", onPurchaseCompleted);
      socket.off("DROP_CREATED", onDropCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    if (connectionState === "connected") return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 12_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  const showSkeletons = dropsQuery.isLoading && items.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Active Drops</h2>
        <button
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <StatusBar lastUpdatedAt={lastUpdatedAt} loading={loading} ok={ok} socketState={connectionState} />

      {errorMessage && <ErrorBanner message={errorMessage} onRetry={refresh} retrying={loading} />}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showSkeletons &&
          Array.from({ length: 6 }).map((_, i) => <DropCardSkeleton key={`s-${i}`} />)}

        {!showSkeletons &&
          items.map((d) => (
            <DropCard
              key={d.id}
              drop={d}
              onReserve={reserve}
              onPurchase={purchase}
              busy={busyDropId === d.id}
              reservation={reservationsByDropId[d.id] ?? null}
              now={now}
              stockFlash={Boolean(stockFlash[d.id])}
            />
          ))}

        {!loading && items.length === 0 && !errorMessage && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
            No active drops. Create one via seed (`api: db:seed`) or POST `/api/drops`.
          </div>
        )}
      </div>
    </>
  );
}
