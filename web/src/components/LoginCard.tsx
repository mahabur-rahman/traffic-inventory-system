import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import { Spinner } from "./Spinner";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function LoginCard() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const maybeId = userId.trim();
      if (maybeId && !isUuid(maybeId)) {
        throw new Error("User ID must be a UUID");
      }

      login(username, maybeId || undefined);
      toast.success("Signed in");
      setUsername("");
      setUserId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-zinc-800/70 bg-zinc-950/50 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:max-w-xl sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Sign in</h2>
      <p className="mt-2 text-base leading-relaxed text-zinc-400">
        Enter a username to continue. Optionally provide a User ID to simulate multiple users across tabs.
      </p>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <div className="text-sm font-semibold text-zinc-200">
            Username <span className="text-zinc-500">(required)</span>
          </div>
          <input
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-lg text-zinc-100 placeholder:text-zinc-600 shadow-sm ring-1 ring-transparent transition focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200 sm:text-xl"
            placeholder="alice"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="block space-y-2">
          <div className="text-sm font-semibold text-zinc-200">User ID (optional UUID)</div>
          <input
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 font-mono text-lg text-zinc-100 placeholder:text-zinc-600 shadow-sm ring-1 ring-transparent transition focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200 sm:text-xl"
            placeholder="e.g. 2f1e2b9d-8a9d-4b77-9c4f-0b21d0b2f0c1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
          />
        </label>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-lg font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200 sm:text-xl"
          disabled={loading}
          type="submit"
        >
          {loading ? <Spinner className="text-zinc-700" /> : null}
          <span>{loading ? "Signing in..." : "Continue"}</span>
        </button>
      </form>
    </div>
  );
}
