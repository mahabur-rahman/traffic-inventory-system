import { FiInfo } from "react-icons/fi";

export function SessionBanner() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-base text-zinc-300 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200">
          <FiInfo />
        </span>
        <div>
          <div className="font-semibold text-zinc-100">Session active</div>
          <div className="mt-0.5 text-zinc-400">Open multiple tabs to test real-time stock sync.</div>
        </div>
      </div>
    </div>
  );
}

