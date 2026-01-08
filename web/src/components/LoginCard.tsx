import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";

import { useAuth } from "../hooks/useAuth";
import { Spinner } from "./Spinner";

export function LoginCard() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      login(username);
      toast.success("Signed in");
      setUsername("");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-zinc-800/70 bg-zinc-950/50 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:max-w-xl sm:p-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200 shadow-sm">
          <FiLogIn className="text-lg" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Sign in</h2>
      </div>
      <p className="mt-2 text-base leading-relaxed text-zinc-400">
        Enter a username to continue.
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
