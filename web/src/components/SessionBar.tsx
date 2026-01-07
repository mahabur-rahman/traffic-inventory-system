import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { dropsKey, myReservationsKey } from "../hooks/queries";
import { useAppSelector } from "../store/hooks";

export function SessionBar() {
  const { logout } = useAuth();
  const session = useAppSelector((s) => s.session);
  const queryClient = useQueryClient();

  const isAuthed = Boolean(session.userId && session.username);

  if (!isAuthed) return null;

  const initial = (session.username || "?").trim().slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 shadow-sm">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-200">
          {initial}
        </div>
        <div className="leading-tight">
          <div className="text-xs font-semibold text-zinc-100">{session.username}</div>
          {session.userId ? (
            <div className="font-mono text-[10px] text-zinc-500" title={session.userId}>
              {session.userId.slice(0, 8)}...
            </div>
          ) : null}
        </div>
      </div>
      <button
        className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm shadow-sm hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
        onClick={async () => {
          logout();
          toast.success("Signed out");
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: dropsKey }),
            queryClient.invalidateQueries({ queryKey: myReservationsKey })
          ]);
        }}
      >
        Logout
      </button>
    </div>
  );
}
