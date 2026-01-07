import type { Drop } from "../types/drop";
import type { MyReservation } from "../types/reservation";
import { formatRelativeTime } from "../lib/time";
import { Spinner } from "./Spinner";

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

function statusStyles(status: string) {
  switch (status) {
    case "live":
      return { dot: "bg-emerald-400", text: "text-emerald-200", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "scheduled":
      return { dot: "bg-yellow-400", text: "text-yellow-200", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    case "ended":
      return { dot: "bg-zinc-400", text: "text-zinc-200", bg: "bg-zinc-500/10", border: "border-zinc-500/30" };
    case "cancelled":
      return { dot: "bg-red-400", text: "text-red-200", bg: "bg-red-500/10", border: "border-red-500/30" };
    default:
      return { dot: "bg-zinc-400", text: "text-zinc-200", bg: "bg-zinc-500/10", border: "border-zinc-500/30" };
  }
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
  const status = statusStyles(d.status);

  const now = props.now ?? new Date();
  const reservation = props.reservation ?? null;
  const reservationMs =
    reservation?.expires_at ? new Date(reservation.expires_at).getTime() - now.getTime() : null;
  const hasActiveReservation = Boolean(reservation && reservationMs !== null && reservationMs > 0);

  const canReserve =
    d.available_stock > 0 && (d.status === "live" || d.status === "scheduled") && !hasActiveReservation;

  const reserveLabel = (() => {
    if (props.busy) return "Reserving";
    if (hasActiveReservation) return "Reserved";
    if (d.available_stock <= 0) return "Sold out";
    return "Reserve";
  })();

  return (
    <div
      className={[
        "rounded-2xl border bg-zinc-950/45 p-5 shadow-sm transition-colors hover:bg-zinc-950/70",
        props.stockFlash ? "border-emerald-500/60 shadow-emerald-500/10" : "border-zinc-800 hover:border-zinc-700"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-semibold tracking-tight">{d.name}</div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs ${status.bg} ${status.border} ${status.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className="capitalize">{d.status}</span>
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Price <span className="text-zinc-200">{formatMoney(d.price)}</span>
            <span className="mx-2 text-zinc-700">•</span>
            Total <span className="tabular-nums text-zinc-200">{d.total_stock}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-zinc-400">Available</div>
          <div
            className={[
              "mt-1 inline-flex min-w-16 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-3xl font-bold tabular-nums shadow-sm",
              props.stockFlash ? "text-emerald-200" : "text-zinc-100"
            ].join(" ")}
          >
            {d.available_stock}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        {hasActiveReservation && reservationMs !== null ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">Reserved</span>
            <span className="font-mono tabular-nums">{formatCountdown(reservationMs)}</span>
          </div>
        ) : (
          <div className="text-zinc-500">Reserve holds 1 unit for 60s.</div>
        )}
        <div className="text-zinc-500">Updates instantly across tabs.</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className={[
            "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200",
            canReserve && !props.busy ? "bg-white text-zinc-900 hover:bg-zinc-200" : "bg-zinc-800 text-zinc-200"
          ].join(" ")}
          style={!hasActiveReservation ? { gridColumn: "1 / -1" } : undefined}
          disabled={props.busy || !canReserve}
          onClick={async () => {
            try {
              await props.onReserve(d.id);
            } catch {}
          }}
        >
          {props.busy ? <Spinner className={canReserve ? "text-zinc-700" : "text-zinc-200"} /> : null}
          <span>{reserveLabel}</span>
        </button>

        {hasActiveReservation && (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200"
            disabled={props.busy}
            onClick={async () => {
              try {
                await props.onPurchase(d.id);
              } catch {}
            }}
          >
            {props.busy ? <Spinner className="text-emerald-950" /> : null}
            <span>{props.busy ? "Purchasing" : "Purchase"}</span>
          </button>
        )}
      </div>

      {!hasActiveReservation && (
        <div className="mt-2 text-xs text-zinc-500">Purchase unlocks after a successful reserve.</div>
      )}

      <div className="mt-5 border-t border-zinc-800/70 pt-4">
        <div className="text-xs font-semibold text-zinc-300">Latest purchasers</div>
        <div className="mt-2 space-y-1.5 text-sm">
          {latest.map((p) => (
            <div
              key={`${d.id}-${p.user_id}-${p.created_at}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-2.5 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                <span className="truncate text-zinc-200">{p.username}</span>
              </div>
              <span className="shrink-0 text-xs text-zinc-500">{formatRelativeTime(p.created_at, now)}</span>
            </div>
          ))}
          {latest.length === 0 && <div className="text-zinc-500">No purchases yet</div>}
        </div>
      </div>
    </div>
  );
}
