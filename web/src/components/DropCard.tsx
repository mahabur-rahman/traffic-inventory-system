import type { Drop } from "../types/drop";
import type { MyReservation } from "../types/reservation";
import { formatDurationHms, formatLocalDateTime, formatRelativeTime } from "../lib/time";
import { Spinner } from "./Spinner";

export type DropCardProps = {
  drop: Drop;
  onReserve: (dropId: string) => Promise<void>;
  onPurchase: (dropId: string) => Promise<void>;
  onCancel?: (dropId: string, reservationId: string) => Promise<void>;
  busyAction?: "reserve" | "purchase" | "cancel" | null;
  reservation?: MyReservation | null;
  now?: Date;
  stockFlash?: boolean;
};

function formatMoneyFromCents(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
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

  const now = props.now ?? new Date();
  const nowMs = now.getTime();

  const startsAtMs = d.starts_at ? new Date(d.starts_at).getTime() : null;
  const endsAtMs = d.ends_at ? new Date(d.ends_at).getTime() : null;

  const hasStartsAt = startsAtMs !== null && !Number.isNaN(startsAtMs);
  const hasEndsAt = endsAtMs !== null && !Number.isNaN(endsAtMs);

  const isUpcoming = d.status === "scheduled" && hasStartsAt && startsAtMs! > nowMs;
  const isEndedByTime = hasEndsAt && endsAtMs! <= nowMs;

  const clientStatus = (() => {
    if (isEndedByTime) return "ended";
    if (d.status === "scheduled" && (!hasStartsAt || startsAtMs! <= nowMs)) return "live";
    return d.status;
  })();

  const status = statusStyles(clientStatus);

  const isReserving = props.busyAction === "reserve";
  const isPurchasing = props.busyAction === "purchase";
  const isCancelling = props.busyAction === "cancel";
  const isBusy = isReserving || isPurchasing || isCancelling;

  const reservation = props.reservation ?? null;
  const reservationMs =
    reservation?.expires_at ? new Date(reservation.expires_at).getTime() - now.getTime() : null;
  const hasActiveReservation = Boolean(reservation && reservationMs !== null && reservationMs > 0);

  const canReserve = d.available_stock > 0 && clientStatus === "live" && !hasActiveReservation && !isUpcoming && !isEndedByTime;

  const reserveLabel = (() => {
    if (isReserving) return "Reserving";
    if (hasActiveReservation) return "Reserved";
    if (isUpcoming) return "Scheduled";
    if (d.available_stock <= 0) return "Sold out";
    return "Reserve";
  })();

  return (
    <div
      className={[
        "rounded-3xl border bg-zinc-950/45 p-5 shadow-sm transition-colors hover:bg-zinc-950/70 sm:p-6",
        props.stockFlash ? "border-emerald-500/60 shadow-emerald-500/10" : "border-zinc-800 hover:border-zinc-700"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-lg font-semibold tracking-tight">{d.name}</div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs ${status.bg} ${status.border} ${status.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className="capitalize">{clientStatus}</span>
            </span>
          </div>
          <div className="mt-1 text-base text-zinc-400">
            Price <span className="text-zinc-200">{formatMoneyFromCents(d.price, d.currency ?? "USD")}</span>
            <span className="mx-2 text-zinc-700">•</span>
            Total <span className="tabular-nums text-zinc-200">{d.total_stock}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm text-zinc-400">Available</div>
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
        {hasActiveReservation && reservationMs !== null ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">Reserved</span>
            <span className="font-mono tabular-nums">{formatCountdown(reservationMs)}</span>
          </div>
        ) : isUpcoming && d.starts_at && hasStartsAt ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-yellow-200">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span className="font-semibold">Starts in</span>
            <span className="font-mono tabular-nums">{formatDurationHms(startsAtMs! - nowMs)}</span>
          </div>
        ) : (
          <div className="text-zinc-500">Reserve holds 1 unit for 60s.</div>
        )}

        {d.ends_at && hasEndsAt && endsAtMs! > nowMs ? (
          <div className="text-zinc-500">
            Ends {formatRelativeTime(d.ends_at, now)} • {formatLocalDateTime(d.ends_at)}
          </div>
        ) : (
          <div className="text-zinc-500">Updates instantly across tabs.</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {!hasActiveReservation ? (
          <button
            className={[
              "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200",
              canReserve && !isBusy ? "bg-white text-zinc-900 hover:bg-zinc-200" : "bg-zinc-800 text-zinc-200"
            ].join(" ")}
            style={{ gridColumn: "1 / -1" }}
            disabled={isBusy || !canReserve}
            onClick={async () => {
              try {
                await props.onReserve(d.id);
              } catch {}
            }}
          >
            {isReserving ? <Spinner className={canReserve ? "text-zinc-700" : "text-zinc-200"} /> : null}
            <span>{reserveLabel}</span>
          </button>
        ) : (
          <>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200"
              disabled={isBusy}
              onClick={async () => {
                try {
                  await props.onPurchase(d.id);
                } catch {}
              }}
            >
              {isPurchasing ? <Spinner className="text-emerald-950" /> : null}
              <span>{isPurchasing ? "Purchasing" : "Purchase"}</span>
            </button>

            <button
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-200 shadow-sm hover:bg-zinc-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
              disabled={isBusy || !props.onCancel || !reservation?.id}
              onClick={async () => {
                if (!reservation?.id) return;
                try {
                  await props.onCancel?.(d.id, reservation.id);
                } catch {}
              }}
            >
              <span className="inline-flex items-center gap-2">
                {isCancelling ? <Spinner className="text-zinc-200" /> : null}
                {isCancelling ? "Cancelling..." : "Cancel"}
              </span>
            </button>
          </>
        )}
      </div>

      {!hasActiveReservation && (
        <div className="mt-2 text-sm text-zinc-500">Purchase unlocks after a successful reserve.</div>
      )}

      <div className="mt-5 border-t border-zinc-800/70 pt-4">
        <div className="text-sm font-semibold text-zinc-200">Latest purchasers</div>
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
