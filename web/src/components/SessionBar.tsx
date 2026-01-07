import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { dropsKey, myReservationsKey } from "../hooks/queries";
import { useAppSelector } from "../store/hooks";
import { Spinner } from "./Spinner";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function SessionBar() {
  const { login, logout } = useAuth();
  const session = useAppSelector((s) => s.session);
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const isAuthed = Boolean(session.userId && session.username);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const maybeId = userId.trim();
      if (maybeId && !isUuid(maybeId)) {
        throw new Error("User ID must be a UUID");
      }
      login(username, maybeId || undefined);
      toast.success("Signed in");
      setUsername("");
      setUserId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dropsKey }),
        queryClient.invalidateQueries({ queryKey: myReservationsKey })
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {!isAuthed ? (
        <form className="flex items-center gap-2" onSubmit={onLogin}>
          <input
            className="w-40 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm focus:border-zinc-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
          />
          <input
            className="hidden w-64 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm focus:border-zinc-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200 md:block"
            placeholder="user id (optional UUID)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={busy}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            disabled={busy}
            type="submit"
          >
            {busy ? <Spinner className="text-zinc-700" /> : null}
            <span>{busy ? "Signing in" : "Sign in"}</span>
          </button>
        </form>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

