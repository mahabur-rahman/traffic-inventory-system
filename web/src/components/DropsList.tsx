import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { apiRequest } from "../lib/api";
import { normalizeError } from "../lib/errors";
import type { DropsListResponse } from "../types/drop";

export function DropsList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DropsListResponse | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest<DropsListResponse>("/drops");
      setData(res.data);
    } catch (err) {
      const e = normalizeError(err);
      toast.error(`${e.title}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active Drops</h2>
        <button
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-900 disabled:opacity-60"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((d) => (
          <div key={d.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{d.name}</div>
                <div className="mt-1 text-sm text-zinc-400">Price: {d.price}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Available</div>
                <div className="text-2xl font-bold tabular-nums">{d.available_stock}</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-400">
              Status: <span className="text-zinc-200">{d.status}</span>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-300">Latest Purchasers</div>
              <div className="mt-2 space-y-1 text-sm">
                {(d.activity_feed?.latest_purchasers ?? []).slice(0, 3).map((p) => (
                  <div key={`${d.id}-${p.user_id}-${p.created_at}`} className="flex items-center justify-between">
                    <span className="text-zinc-200">{p.username}</span>
                    <span className="text-zinc-500">{new Date(p.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {(d.activity_feed?.latest_purchasers?.length ?? 0) === 0 && (
                  <div className="text-zinc-500">No purchases yet</div>
                )}
              </div>
            </div>
          </div>
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
