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
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 shadow-sm"
      aria-label={`Socket ${label.toLowerCase()}`}
      title={`Socket: ${label}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="font-semibold">{label}</span>
    </span>
  );
}
