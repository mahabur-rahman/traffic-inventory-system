import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiHash,
  FiPlus,
  FiPlusCircle,
  FiTag,
  FiX
} from "react-icons/fi";

import { notifyError, notifySuccess } from "../lib/notify";
import { formatLocalDateTime, formatRelativeTime } from "../lib/time";
import { useCreateDropMutation } from "../hooks/queries";

function inputClassName(disabled?: boolean) {
  return [
    "w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-lg text-zinc-100 shadow-sm",
    "placeholder:text-zinc-600",
    "ring-1 ring-transparent transition focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20",
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

function toIsoFromDateAndTimeOrNull(date: string, time: string) {
  const d = date.trim();
  const t = time.trim();
  if (!d && !t) return null;
  if (!d || !t) throw new Error("Both date and time are required");

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  const matchT = /^(\d{2}):(\d{2})$/.exec(t);
  if (!match || !matchT) throw new Error("Invalid date/time");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(matchT[1]);
  const minute = Number(matchT[2]);

  const dt = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid date/time");
  return dt.toISOString();
}

export function CreateDropPanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priceDollars, setPriceDollars] = useState("50");
  const [totalStock, setTotalStock] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<"live" | "scheduled">("live");

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

  const startsPreview = useMemo(() => {
    try {
      const iso = toIsoFromDateAndTimeOrNull(startDate, startTime);
      if (!iso) return null;
      return { iso, local: formatLocalDateTime(iso), relative: formatRelativeTime(iso, new Date()) };
    } catch {
      return null;
    }
  }, [startDate, startTime]);

  const endsPreview = useMemo(() => {
    try {
      const iso = toIsoFromDateAndTimeOrNull(endDate, endTime);
      if (!iso) return null;
      return { iso, local: formatLocalDateTime(iso), relative: formatRelativeTime(iso, new Date()) };
    } catch {
      return null;
    }
  }, [endDate, endTime]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200"
        type="button"
        onClick={() => setOpen(true)}
      >
        <FiPlus className="text-base" />
        <span>Create drop</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Create drop"
              className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/40 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
                      <FiPlusCircle className="text-emerald-300" />
                      Create Drop
                    </div>
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                      API
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Creates a new drop via <span className="font-mono">POST /api/drops</span>.
                  </div>
                </div>

                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200 shadow-sm hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  <FiX />
                </button>
              </div>

              <form
                className="mt-6 grid max-h-[70vh] gap-5 overflow-y-auto pr-1 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const price = toCentsFromDollarsString(priceDollars);
                    const stock = Number.parseInt(totalStock, 10);
                    if (!Number.isFinite(stock) || stock < 0) throw new Error("Invalid stock");

                    const startsIso = toIsoFromDateAndTimeOrNull(startDate, startTime);
                    const endsIso = toIsoFromDateAndTimeOrNull(endDate, endTime);

                    if (status === "scheduled" && !startsIso) {
                      throw new Error("Start date & time is required when status is scheduled");
                    }
                    if (status === "live" && startsIso && new Date(startsIso).getTime() > Date.now()) {
                      throw new Error("For a future start time, set status to scheduled");
                    }
                    if (startsIso && endsIso && new Date(endsIso) <= new Date(startsIso)) {
                      throw new Error("Ends at must be after starts at");
                    }

                    await createDrop.mutateAsync({
                      name,
                      currency: currency.trim().toUpperCase(),
                      price,
                      total_stock: stock,
                      starts_at: startsIso,
                      ends_at: endsIso,
                      status
                    });

                    notifySuccess("Drop created");
                    setOpen(false);
                    setName("");
                    setTotalStock("10");
                    setStartDate("");
                    setStartTime("");
                    setEndDate("");
                    setEndTime("");
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
                    <FiTag className="text-zinc-400" />
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
                    <FiHash className="text-zinc-400" />
                    Status
                  </div>
                  <select
                    className={inputClassName(disabled)}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    disabled={disabled}
                  >
                    <option value="live">live</option>
                    <option value="scheduled">scheduled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className={labelClassName()}>
                    <FiCalendar className="text-zinc-400" />
                    Starts at {status === "scheduled" ? "(required)" : "(optional)"}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      className={inputClassName(disabled)}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={disabled}
                      type="date"
                    />
                    <input
                      className={inputClassName(disabled)}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={disabled}
                      type="time"
                      step={60}
                    />
                  </div>
                  {startsPreview ? (
                    <div className="text-xs text-zinc-500">
                      {startsPreview.local} • {startsPreview.relative}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">Uses your device's local time.</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className={labelClassName()}>
                    <FiCalendar className="text-zinc-400" />
                    Ends at (optional)
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      className={inputClassName(disabled)}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={disabled}
                      type="date"
                      min={startDate || undefined}
                    />
                    <input
                      className={inputClassName(disabled)}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={disabled}
                      type="time"
                      step={60}
                      min={endDate && endDate === startDate ? startTime || undefined : undefined}
                    />
                  </div>
                  {endsPreview ? (
                    <div className="text-xs text-zinc-500">
                      {endsPreview.local} • {endsPreview.relative}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">Leave empty for no end time.</div>
                  )}
                </div>

                <div className="sm:col-span-2 mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-zinc-500">
                    New drops broadcast to all clients via <span className="font-mono">DROP_CREATED</span>.
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-base font-semibold text-zinc-200 shadow-sm hover:bg-zinc-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={disabled}
                    >
                      Cancel
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200"
                      disabled={disabled}
                      type="submit"
                    >
                      <FiPlusCircle />
                      {disabled ? "Creating..." : "Create drop"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
