import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import { Spinner } from "./Spinner";

export function LoginCard() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      login(username);
      toast.success("Signed in (dev)");
      setUsername("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sign in</h2>
      <p className="mt-1 text-sm text-zinc-400">Use any username to simulate a user session (dev).</p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm text-zinc-300">
          Username
          <input
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-200"
            placeholder="alice"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
