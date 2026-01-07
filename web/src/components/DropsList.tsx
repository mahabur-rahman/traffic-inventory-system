import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../lib/api";
import type { DropsListResponse } from "../types/drop";
import { DropCard } from "./DropCard";
import { StatusBar } from "./StatusBar";

export function DropsList() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [data, setData] = useState<DropsListResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [busyDropId, setBusyDropId] = useState<string | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest<DropsListResponse>("/drops");
      setData(res.data);
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
      await apiRequest(`/drops/${dropId}/reserve`, { method: "POST" });
      await load();
    } finally {
      setBusyDropId(null);
    }
  }

  async function purchase(dropId: string) {
    setBusyDropId(dropId);
    try {
      await apiRequest(`/drops/${dropId}/purchase`, { method: "POST" });
      await load();
    } finally {
      setBusyDropId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <StatusBar lastUpdatedAt={lastUpdatedAt} loading={loading} ok={ok} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <DropCard
            key={d.id}
            drop={d}
            onReserve={reserve}
            onPurchase={purchase}
            busy={busyDropId === d.id}
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
