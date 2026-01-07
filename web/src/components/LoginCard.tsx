import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

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
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow">
      <h2 className="text-xl font-semibold">Dev Sign-in</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Enter any username. We generate a UUID and send it as <span className="font-mono">X-User-Id</span>.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm text-zinc-300">
          Username
          <input
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
            placeholder="alice"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </label>

        <button
          className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
