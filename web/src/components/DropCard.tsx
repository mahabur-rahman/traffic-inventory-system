import toast from "react-hot-toast";

import type { Drop } from "../types/drop";
import { normalizeError } from "../lib/errors";

export type DropCardProps = {
  drop: Drop;
  onReserve: (dropId: string) => Promise<void>;
  onPurchase: (dropId: string) => Promise<void>;
  busy?: boolean;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function DropCard(props: DropCardProps) {
  const d = props.drop;
  const latest = (d.activity_feed?.latest_purchasers ?? []).slice(0, 3);

  const canReserve = d.available_stock > 0 && (d.status === "live" || d.status === "scheduled");
  const canPurchase = d.status === "live" || d.status === "scheduled";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{d.name}</div>
          <div className="mt-1 text-sm text-zinc-400">Price: {formatMoney(d.price)}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400">Live stock</div>
          <div className="text-3xl font-bold tabular-nums">{d.available_stock}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <div>
          Status: <span className="text-zinc-200">{d.status}</span>
        </div>
        <div>
          Total: <span className="text-zinc-200 tabular-nums">{d.total_stock}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
          disabled={props.busy || !canReserve}
          onClick={async () => {
            try {
              await props.onReserve(d.id);
              toast.success("Reserved");
            } catch (err) {
              const e = normalizeError(err);
              toast.error(`${e.title}: ${e.message}`);
            }
          }}
        >
          {props.busy ? "Working..." : "Reserve"}
        </button>

        <button
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 disabled:opacity-60"
          disabled={props.busy || !canPurchase}
          onClick={async () => {
            try {
              await props.onPurchase(d.id);
              toast.success("Purchased");
            } catch (err) {
              const e = normalizeError(err);
              toast.error(`${e.title}: ${e.message}`);
            }
          }}
        >
          {props.busy ? "Working..." : "Purchase"}
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-zinc-300">Latest purchasers</div>
        <div className="mt-2 space-y-1 text-sm">
          {latest.map((p) => (
            <div key={`${d.id}-${p.user_id}-${p.created_at}`} className="flex items-center justify-between">
              <span className="truncate text-zinc-200">{p.username}</span>
              <span className="shrink-0 text-zinc-500">{new Date(p.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {latest.length === 0 && <div className="text-zinc-500">No purchases yet</div>}
        </div>
      </div>
    </div>
  );
}

