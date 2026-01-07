export function ErrorBanner(props: { message: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-red-100">
          <div className="font-semibold">API error</div>
          <div className="mt-0.5 text-xs text-red-200/80">{props.message}</div>
        </div>
        <button
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-50 hover:bg-red-500/15 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-200"
          onClick={props.onRetry}
          disabled={props.retrying}
        >
          {props.retrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

