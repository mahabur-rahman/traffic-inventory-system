import { API_ORIGIN } from "../lib/env";

export type StatusBarProps = {
  lastUpdatedAt: Date | null;
  loading: boolean;
  ok: boolean | null;
};

export function StatusBar(props: StatusBarProps) {
  const dotClass =
    props.ok === null
      ? "bg-zinc-500"
      : props.ok
        ? "bg-emerald-400"
        : "bg-red-400";

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span className="text-zinc-400">API:</span>
          <span className="font-mono text-xs">{API_ORIGIN}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>{props.loading ? "Syncing..." : "Idle"}</span>
          <span className="text-zinc-600">•</span>
          <span>
            Last updated:{" "}
            {props.lastUpdatedAt ? props.lastUpdatedAt.toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

