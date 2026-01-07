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

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-[11px] text-zinc-400">Signed in</div>
        <div className="text-sm font-semibold">{session.username}</div>
        {session.userId ? (
          <div className="font-mono text-[11px] text-zinc-500" title={session.userId}>
            {session.userId.slice(0, 8)}...
          </div>
        ) : null}
      </div>
      <button
        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm shadow-sm hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
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
