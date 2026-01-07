export function formatRelativeTime(fromIso: string, now: Date = new Date()) {
  const from = new Date(fromIso);
  const deltaMs = from.getTime() - now.getTime();
  if (Number.isNaN(deltaMs)) return "—";

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const seconds = Math.round(deltaMs / 1000);

  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(days, "day");
}

