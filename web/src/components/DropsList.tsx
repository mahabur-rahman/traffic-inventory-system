import { useEffect, useMemo, useRef, useState } from "react";

import { apiRequest } from "../lib/api";
import type { DropsListResponse } from "../types/drop";
import { DropCard } from "./DropCard";
import { StatusBar } from "./StatusBar";
import type { MyReservation, ReservationsMeResponse } from "../types/reservation";
import { notifyInfo } from "../lib/notify";
import { useSocket } from "../hooks/useSocket";

export function DropsList() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [data, setData] = useState<DropsListResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [busyDropId, setBusyDropId] = useState<string | null>(null);
  const [reservationsByDropId, setReservationsByDropId] = useState<Record<string, MyReservation>>({});
  const [now, setNow] = useState<Date>(() => new Date());
  const [stockFlash, setStockFlash] = useState<Record<string, boolean>>({});

  const flashTimers = useRef<Record<string, number>>({});
  const expiredNotified = useRef<Record<string, boolean>>({});
  const { socket, connectionState } = useSocket();

  const items = useMemo(() => data?.items ?? [], [data]);

  function flashDrop(dropId: string) {
    setStockFlash((prev) => ({ ...prev, [dropId]: true }));
    const existing = flashTimers.current[dropId];
    if (existing) window.clearTimeout(existing);
    flashTimers.current[dropId] = window.setTimeout(() => {
      setStockFlash((prev) => ({ ...prev, [dropId]: false }));
      delete flashTimers.current[dropId];
    }, 650);
  }

  async function load() {
    setLoading(true);
    try {
      const [dropsRes, reservationsRes] = await Promise.all([
        apiRequest<DropsListResponse>("/drops"),
        apiRequest<ReservationsMeResponse>("/reservations/me")
      ]);

      setData(dropsRes.data);
      setReservationsByDropId(() => {
        const map: Record<string, MyReservation> = {};
        for (const r of reservationsRes.data.items ?? []) {
          if (r.drop_id) map[r.drop_id] = r;
        }
        return map;
      });
      setOk(true);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setOk(false);
    } finally {
      setLoading(false);
    }
  }

  async function reserve(dropId: string) {
    setBusyDropId(dropId);
    try {
      const res = await apiRequest<{ reservation: MyReservation; drop: { id: string; available_stock: number } }>(
        `/drops/${dropId}/reserve`,
        { method: "POST" }
      );
      delete expiredNotified.current[dropId];
      setReservationsByDropId((prev) => ({ ...prev, [dropId]: res.data.reservation }));
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((d) =>
            d.id === dropId ? { ...d, available_stock: res.data.drop.available_stock } : d
          )
        };
      });
      flashDrop(dropId);
      setLastUpdatedAt(new Date());
    } finally {
      setBusyDropId(null);
    }
  }

  async function purchase(dropId: string) {
    setBusyDropId(dropId);
    try {
      await apiRequest(`/drops/${dropId}/purchase`, { method: "POST" });
      setReservationsByDropId((prev) => {
        const next = { ...prev };
        delete next[dropId];
        return next;
      });
      await load();
    } finally {
      setBusyDropId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setReservationsByDropId((prev) => {
      let changed = false;
      const next: Record<string, MyReservation> = { ...prev };

      for (const [dropId, r] of Object.entries(prev)) {
        if (!r.expires_at) continue;
        const expiresAt = new Date(r.expires_at).getTime();
        if (Number.isNaN(expiresAt)) continue;

        if (expiresAt <= now.getTime()) {
          delete next[dropId];
          changed = true;
          if (!expiredNotified.current[dropId]) {
            expiredNotified.current[dropId] = true;
            notifyInfo("Reservation expired");
          }
        }
      }

      return changed ? next : prev;
    });
  }, [now]);

  useEffect(() => {
    if (!socket) return;

    const onStock = (payload: { dropId: string; availableStock: number }) => {
      setData((prev) => {
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
      setLastUpdatedAt(new Date());
    };

    const onActivity = (payload: {
      dropId: string;
      latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
    }) => {
      setData((prev) => {
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
      setLastUpdatedAt(new Date());
    };

    const onExpired = (payload: { dropId: string; reservationId: string }) => {
      setReservationsByDropId((prev) => {
        const r = prev[payload.dropId];
        if (!r || r.id !== payload.reservationId) return prev;
        const next = { ...prev };
        delete next[payload.dropId];
        return next;
      });
      notifyInfo("Reservation expired");
      setLastUpdatedAt(new Date());
    };

    const onDropCreated = (_payload: { drop: unknown }) => {
      void load();
    };

    socket.on("STOCK_UPDATED", onStock);
    socket.on("ACTIVITY_UPDATED", onActivity);
    socket.on("RESERVATION_EXPIRED", onExpired);
    socket.on("DROP_CREATED", onDropCreated);

    return () => {
      socket.off("STOCK_UPDATED", onStock);
      socket.off("ACTIVITY_UPDATED", onActivity);
      socket.off("RESERVATION_EXPIRED", onExpired);
      socket.off("DROP_CREATED", onDropCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Active Drops</h2>
        <button
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-900 disabled:opacity-60"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <StatusBar lastUpdatedAt={lastUpdatedAt} loading={loading} ok={ok} socketState={connectionState} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
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
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
            No active drops. Create one via seed (`api: db:seed`) or POST `/api/drops`.
          </div>
        )}
      </div>
    </section>
  );
}
