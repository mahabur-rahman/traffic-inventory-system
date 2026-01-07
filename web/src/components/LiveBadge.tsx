import type { SocketConnectionState } from "../types/socket";

export function LiveBadge(props: { state: SocketConnectionState }) {
  const dot =
    props.state === "connected"
      ? "bg-emerald-400"
      : props.state === "reconnecting"
        ? "bg-yellow-400"
        : "bg-red-400";

  const label =
    props.state === "connected" ? "Live" : props.state === "reconnecting" ? "Reconnecting" : "Offline";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-200"
      aria-label={`Socket ${label.toLowerCase()}`}
      title={`Socket: ${label}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="font-medium">{label}</span>
    </span>
  );
}
