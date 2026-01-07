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
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sign in</h2>
      <p className="mt-1 text-sm text-zinc-400">
        This is a dev-only session. We store your session in localStorage and send{" "}
        <span className="font-mono">X-User-Id</span> and <span className="font-mono">X-User-Name</span>.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm text-zinc-300">
          Username
          <input
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 shadow-sm focus:border-zinc-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            placeholder="alice"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="block text-sm text-zinc-300">
          User ID (optional UUID)
          <input
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm focus:border-zinc-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            placeholder="e.g. 2f1e2b9d-8a9d-4b77-9c4f-0b21d0b2f0c1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
          />
        </label>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
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
