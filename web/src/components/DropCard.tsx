import type { Drop } from "../types/drop";
import { notifyError, notifySuccess } from "../lib/notify";
import type { MyReservation } from "../types/reservation";
import { formatRelativeTime } from "../lib/time";

export type DropCardProps = {
  drop: Drop;
  onReserve: (dropId: string) => Promise<void>;
  onPurchase: (dropId: string) => Promise<void>;
  busy?: boolean;
  reservation?: MyReservation | null;
  now?: Date;
  stockFlash?: boolean;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DropCard(props: DropCardProps) {
  const d = props.drop;
  const latest = (d.activity_feed?.latest_purchasers ?? []).slice(0, 3);

  const now = props.now ?? new Date();
  const reservation = props.reservation ?? null;
  const reservationMs =
    reservation?.expires_at ? new Date(reservation.expires_at).getTime() - now.getTime() : null;
  const hasActiveReservation = Boolean(reservation && reservationMs !== null && reservationMs > 0);

  const canReserve =
    d.available_stock > 0 && (d.status === "live" || d.status === "scheduled") && !hasActiveReservation;

  return (
    <div
      className={[
        "rounded-2xl border bg-zinc-950/50 p-4 shadow-sm transition",
        props.stockFlash ? "border-emerald-500/60 shadow-emerald-500/10" : "border-zinc-800"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{d.name}</div>
          <div className="mt-1 text-sm text-zinc-400">Price: {formatMoney(d.price)}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400">Live stock</div>
          <div className={["text-3xl font-bold tabular-nums", props.stockFlash ? "text-emerald-200" : ""].join(" ")}>
            {d.available_stock}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div>
          Status: <span className="text-zinc-200">{d.status}</span>
        </div>
        <div>
          Total: <span className="text-zinc-200 tabular-nums">{d.total_stock}</span>
        </div>
        {hasActiveReservation && reservationMs !== null && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">Reserved</span>
            <span className="font-mono tabular-nums">{formatCountdown(reservationMs)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
          style={!hasActiveReservation ? { gridColumn: "1 / -1" } : undefined}
          disabled={props.busy || !canReserve}
          onClick={async () => {
            try {
              await props.onReserve(d.id);
              notifySuccess("Reserved");
            } catch (err) {
              notifyError(err);
            }
          }}
        >
          {props.busy ? "Reserving..." : hasActiveReservation ? "Reserved" : "Reserve"}
        </button>

        {hasActiveReservation && (
          <button
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            disabled={props.busy}
            onClick={async () => {
              try {
                await props.onPurchase(d.id);
                notifySuccess("Purchased");
              } catch (err) {
                notifyError(err);
              }
            }}
          >
            {props.busy ? "Purchasing..." : "Purchase"}
          </button>
        )}
      </div>

      {!hasActiveReservation && (
        <div className="mt-2 text-xs text-zinc-500">Purchase button appears after you reserve.</div>
      )}

      <div className="mt-4">
        <div className="text-xs font-semibold text-zinc-300">Latest purchasers</div>
        <div className="mt-2 space-y-1 text-sm">
          {latest.map((p) => (
            <div key={`${d.id}-${p.user_id}-${p.created_at}`} className="flex items-center justify-between">
              <span className="truncate text-zinc-200">{p.username}</span>
              <span className="shrink-0 text-zinc-500">{formatRelativeTime(p.created_at, now)}</span>
            </div>
          ))}
          {latest.length === 0 && <div className="text-zinc-500">No purchases yet</div>}
        </div>
      </div>
    </div>
  );
}
