import type { SocketConnectionState } from "../types/socket";

export function LiveBadge(props: { state: SocketConnectionState }) {
  const dot =
    props.state === "connected"
      ? "bg-emerald-400"
      : props.state === "reconnecting"
        ? "bg-yellow-400"
        : "bg-red-400";

  const label =
    props.state === "connected" ? "Live" : props.state === "reconnecting" ? "Reconnecting" : "Disconnected";

  return (
    <span className="inline-flex items-center gap-2" aria-label={`Socket ${label.toLowerCase()}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
}

