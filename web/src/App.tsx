import toast from "react-hot-toast";

import { useAuth } from "./hooks/useAuth";
import { LoginCard } from "./components/LoginCard";
import { DropsList } from "./components/DropsList";

function App() {
  const { auth, isAuthed, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Techzu – Sneaker Drop</h1>
            <p className="text-xs text-zinc-400">Dashboard (function over form)</p>
          </div>

          {isAuthed ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-zinc-400">Signed in as</div>
                <div className="text-sm font-semibold">{auth?.username}</div>
              </div>
              <button
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-900"
                onClick={() => {
                  logout();
                  toast.success("Signed out");
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">Not signed in</div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!isAuthed ? (
          <LoginCard />
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
              Auth is simulated: we generate a UUID and send it in{" "}
              <span className="font-mono">X-User-Id</span> (and{" "}
              <span className="font-mono">X-User-Name</span>).
            </div>
            <DropsList />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
