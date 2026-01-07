import { API_ORIGIN } from "../lib/env";
import type { SocketConnectionState } from "../types/socket";

export type StatusBarProps = {
  lastUpdatedAt: Date | null;
  loading: boolean;
  ok: boolean | null;
  socketState?: SocketConnectionState;
};

export function StatusBar(props: StatusBarProps) {
  const apiDotClass = props.ok === null ? "bg-zinc-500" : props.ok ? "bg-emerald-400" : "bg-red-400";
  const socketDotClass =
    props.socketState === "connected"
      ? "bg-emerald-400"
      : props.socketState === "reconnecting"
        ? "bg-yellow-400"
        : "bg-red-400";

  const chip =
    "inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-300";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className={chip}>
        <span className={`h-2 w-2 rounded-full ${apiDotClass}`} />
        <span className="text-zinc-400">API</span>
        <span className="font-mono">{API_ORIGIN}</span>
      </span>

      <span className={chip}>
        <span className={`h-2 w-2 rounded-full ${socketDotClass}`} />
        <span className="text-zinc-400">Socket</span>
        <span className="capitalize">{props.socketState ?? "disconnected"}</span>
      </span>

      <span className={chip}>
        <span className="text-zinc-400">Sync</span>
        <span>{props.loading ? "Syncing..." : "Idle"}</span>
      </span>

      <span className={chip}>
        <span className="text-zinc-400">Updated</span>
        <span>{props.lastUpdatedAt ? props.lastUpdatedAt.toLocaleTimeString() : "—"}</span>
      </span>
    </div>
  );
}

