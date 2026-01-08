import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { MyReservation } from "../types/reservation";
import { notifyInfo } from "../lib/notify";
import { normalizeError } from "../lib/errors";
import { useSocket } from "../realtime/SocketProvider";
import {
  dropsKey,
  myReservationsKey,
  useDropsQuery,
  useMyReservationsQuery,
  useCancelReservationMutation,
  usePurchaseDropMutation,
  useReserveDropMutation
} from "../hooks/queries";
import { applyActivityUpdated, applyPurchaseCompleted, applyStockUpdated, removeReservationById } from "../hooks/cacheUpdates";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { recordEvent } from "../store/socketSlice";
import { StatusBar } from "../components/StatusBar";
import { DropCard } from "../components/DropCard";
import { DropCardSkeleton } from "../components/DropCardSkeleton";
import { ErrorBanner } from "../components/ErrorBanner";
import { CreateDropPanel } from "../components/CreateDropPanel";

export function Dashboard() {
  const [busyDropId, setBusyDropId] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [stockFlash, setStockFlash] = useState<Record<string, boolean>>({});

  const flashTimers = useRef<Record<string, number>>({});
  const expiredNotified = useRef<Record<string, boolean>>({});
  const inFlight = useRef<Set<string>>(new Set());

  const dispatch = useAppDispatch();
  const socketStatus = useAppSelector((s) => s.socket.status);
  const { socket } = useSocket();

  const queryClient = useQueryClient();
  const dropsQuery = useDropsQuery();
  const reservationsQuery = useMyReservationsQuery();
  const reserveMutation = useReserveDropMutation();
  const purchaseMutation = usePurchaseDropMutation();
  const cancelMutation = useCancelReservationMutation();

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
    const key = `reserve:${dropId}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setBusyDropId(dropId);
    try {
      delete expiredNotified.current[dropId];
      await reserveMutation.mutateAsync(dropId);
      flashDrop(dropId);
    } finally {
      setBusyDropId(null);
      inFlight.current.delete(key);
    }
  }

  async function purchase(dropId: string) {
    const key = `purchase:${dropId}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setBusyDropId(dropId);
    try {
      await purchaseMutation.mutateAsync(dropId);
    } finally {
      setBusyDropId(null);
      inFlight.current.delete(key);
    }
  }

  async function cancel(dropId: string, reservationId: string) {
    const key = `cancel:${reservationId}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setBusyDropId(dropId);
    try {
      await cancelMutation.mutateAsync(reservationId);
      flashDrop(dropId);
    } finally {
      setBusyDropId(null);
      inFlight.current.delete(key);
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
      dispatch(recordEvent());
      applyStockUpdated(queryClient, payload);
      flashDrop(payload.dropId);
    };

    const onActivity = (payload: {
      dropId: string;
      latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
    }) => {
      dispatch(recordEvent());
      applyActivityUpdated(queryClient, payload);
    };

    const onExpired = (payload: { dropId: string; reservationId: string }) => {
      const prev = queryClient.getQueryData<any>(myReservationsKey);
      const items = Array.isArray(prev?.items) ? prev.items : [];
      const isMine = items.some((r: any) => r.id === payload.reservationId);

      dispatch(recordEvent());
      removeReservationById(queryClient, payload.reservationId);

      if (isMine) {
        notifyInfo("Reservation expired");
      }
    };

    const onDropCreated = (_payload: { drop: unknown }) => {
      dispatch(recordEvent());
      void refresh();
    };

    const onPurchaseCompleted = (_payload: { dropId: string; username: string | null; purchasedAt: string }) => {
      dispatch(recordEvent());
      // Prefer cache update; ACTIVITY_UPDATED will still overwrite with exact top-3 list.
      applyPurchaseCompleted(queryClient, _payload);
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
    if (socketStatus === "connected") return;
    const delay = window.setTimeout(() => {
      void refresh();
    }, 5_000);

    const interval = window.setInterval(() => {
      void refresh();
    }, 12_000);

    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketStatus]);

  const showSkeletons = dropsQuery.isLoading && items.length === 0;

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Active Drops</h2>
            <p className="mt-1 text-sm text-zinc-400">Real-time stock updates via WebSocket</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold shadow-sm hover:bg-zinc-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <StatusBar lastUpdatedAt={lastUpdatedAt} loading={loading} ok={ok} socketState={socketStatus} />
      </section>

      <div className="mt-6">
        <CreateDropPanel />
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} onRetry={refresh} retrying={loading} />}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {showSkeletons &&
          Array.from({ length: 6 }).map((_, i) => <DropCardSkeleton key={`s-${i}`} />)}

        {!showSkeletons &&
          items.map((d) => (
            <DropCard
              key={d.id}
              drop={d}
              onReserve={reserve}
              onPurchase={purchase}
              onCancel={cancel}
              busy={busyDropId === d.id}
              reservation={reservationsByDropId[d.id] ?? null}
              now={now}
              stockFlash={Boolean(stockFlash[d.id])}
            />
          ))}

        {!loading && items.length === 0 && !errorMessage && (
          <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300 shadow-sm">
            <div className="font-semibold text-zinc-100">No active drops</div>
            <div className="mt-1 text-zinc-400">Create one via seed or POST `/api/drops`.</div>
          </div>
        )}
      </div>
    </>
  );
}
