import { useMemo, useState } from "react";
import { FiCalendar, FiChevronDown, FiChevronUp, FiDollarSign, FiHash, FiPackage, FiPlusCircle, FiTag } from "react-icons/fi";

import { notifyError, notifySuccess } from "../lib/notify";
import { useCreateDropMutation } from "../hooks/queries";

function inputClassName(disabled?: boolean) {
  return [
    "w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-lg text-zinc-100 shadow-sm ring-1 ring-transparent transition focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 sm:text-xl",
    "placeholder:text-zinc-600",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200",
    disabled ? "opacity-60" : ""
  ].join(" ");
}

function labelClassName() {
  return "text-sm font-semibold text-zinc-200 inline-flex items-center gap-2";
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
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <FiPlusCircle className="text-emerald-300" />
            <span>Create Drop</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
              API
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Optional demo tool; creates a new drop via <span className="font-mono">POST /api/drops</span>.
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-200 shadow-sm">
          <span>{open ? "Hide" : "Show"}</span>
          {open ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      {open && (
        <form
          className="mt-6 grid gap-5 sm:grid-cols-2"
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
          <div className="space-y-2 sm:col-span-2">
            <div className={labelClassName()}>
              <FiTag className="text-zinc-400" />
              Name
            </div>
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

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiPackage className="text-zinc-400" />
              Currency
            </div>
            <input
              className={inputClassName(disabled)}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
              disabled={disabled}
              maxLength={3}
            />
          </div>

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiDollarSign className="text-zinc-400" />
              Price (dollars)
            </div>
            <input
              className={inputClassName(disabled)}
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="50"
              disabled={disabled}
              inputMode="decimal"
            />
            {preview ? <div className="text-sm text-zinc-500">Preview: {preview}</div> : null}
          </div>

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiHash className="text-zinc-400" />
              Total stock
            </div>
            <input
              className={inputClassName(disabled)}
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              placeholder="10"
              disabled={disabled}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiPackage className="text-zinc-400" />
              Status
            </div>
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

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiCalendar className="text-zinc-400" />
              Starts at (optional)
            </div>
            <input
              className={inputClassName(disabled)}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              disabled={disabled}
              type="datetime-local"
            />
          </div>

          <div className="space-y-2">
            <div className={labelClassName()}>
              <FiCalendar className="text-zinc-400" />
              Ends at (optional)
            </div>
            <input
              className={inputClassName(disabled)}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={disabled}
              type="datetime-local"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-500">
              New drops broadcast to all clients via <span className="font-mono">DROP_CREATED</span>.
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-lg font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200 sm:text-xl"
              disabled={disabled}
              type="submit"
            >
              <FiPlusCircle />
              {disabled ? "Creating..." : "Create drop"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
