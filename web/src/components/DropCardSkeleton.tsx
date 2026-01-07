export function DropCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-1/3 rounded bg-zinc-800/80" />
        </div>
        <div className="text-right">
          <div className="h-3 w-16 rounded bg-zinc-800/80" />
          <div className="mt-2 h-8 w-12 rounded bg-zinc-800" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-9 rounded-xl bg-zinc-800" />
        <div className="h-9 rounded-xl bg-zinc-900" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-3 w-28 rounded bg-zinc-800/80" />
        <div className="h-3 w-full rounded bg-zinc-800/60" />
        <div className="h-3 w-4/5 rounded bg-zinc-800/60" />
      </div>
    </div>
  );
}

