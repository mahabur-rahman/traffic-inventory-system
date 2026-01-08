import { useMemo, useState } from "react";

import { notifyError, notifySuccess } from "../lib/notify";
import { useCreateDropMutation } from "../hooks/queries";

function inputClassName(disabled?: boolean) {
  return [
    "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-zinc-100 shadow-sm",
    "placeholder:text-zinc-600",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200",
    disabled ? "opacity-60" : ""
  ].join(" ");
}

function labelClassName() {
  return "text-sm font-semibold text-zinc-200";
}

function toCentsFromDollarsString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) throw new Error("Invalid price");
  return Math.max(0, Math.round(n * 100));
}

function toIsoOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString();
}

export function CreateDropPanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priceDollars, setPriceDollars] = useState("50");
  const [totalStock, setTotalStock] = useState("10");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [status, setStatus] = useState<"auto" | "draft" | "scheduled" | "live" | "ended" | "cancelled">("auto");

  const createDrop = useCreateDropMutation();
  const disabled = createDrop.isPending;

  const preview = useMemo(() => {
    try {
      const cents = toCentsFromDollarsString(priceDollars);
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (currency || "USD").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cents / 100);
    } catch {
      return null;
    }
  }, [priceDollars, currency]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="min-w-0">
          <div className="text-base font-semibold text-zinc-100">Create Drop (API)</div>
          <div className="mt-1 text-sm text-zinc-400">
            Optional demo tool; creates a new drop via <span className="font-mono">POST /api/drops</span>.
          </div>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <form
          className="mt-5 grid gap-5 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const price = toCentsFromDollarsString(priceDollars);
              const stock = Number.parseInt(totalStock, 10);
              if (!Number.isFinite(stock) || stock < 0) throw new Error("Invalid stock");

              await createDrop.mutateAsync({
                name,
                currency: currency.trim().toUpperCase(),
                price,
                total_stock: stock,
                starts_at: toIsoOrNull(startsAt),
                ends_at: toIsoOrNull(endsAt),
                status: status === "auto" ? undefined : status
              });

              notifySuccess("Drop created");
              setName("");
              setTotalStock("10");
            } catch (err) {
              notifyError(err);
            }
          }}
        >
          <div className="space-y-1.5">
            <div className={labelClassName()}>Name</div>
            <input
              className={inputClassName(disabled)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Air Jordan 1"
              disabled={disabled}
              required
              minLength={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className={labelClassName()}>Currency</div>
              <input
                className={inputClassName(disabled)}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                disabled={disabled}
                maxLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <div className={labelClassName()}>Price (dollars)</div>
              <input
                className={inputClassName(disabled)}
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="50"
                disabled={disabled}
                inputMode="decimal"
              />
              {preview ? <div className="text-xs text-zinc-500">Preview: {preview}</div> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className={labelClassName()}>Total stock</div>
            <input
              className={inputClassName(disabled)}
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              placeholder="10"
              disabled={disabled}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <div className={labelClassName()}>Status</div>
            <select
              className={inputClassName(disabled)}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={disabled}
            >
              <option value="auto">Auto (recommended)</option>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="ended">ended</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className={labelClassName()}>Starts at (optional)</div>
            <input
              className={inputClassName(disabled)}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              disabled={disabled}
              type="datetime-local"
            />
          </div>

          <div className="space-y-1.5">
            <div className={labelClassName()}>Ends at (optional)</div>
            <input
              className={inputClassName(disabled)}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={disabled}
              type="datetime-local"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              New drops broadcast to all clients via <span className="font-mono">DROP_CREATED</span>.
            </div>
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-base font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
              disabled={disabled}
              type="submit"
            >
              {disabled ? "Creating..." : "Create drop"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
