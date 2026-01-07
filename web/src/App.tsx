import { useAuth } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { LiveBadge } from "./components/LiveBadge";
import { SessionBar } from "./components/SessionBar";
import { LoginCard } from "./components/LoginCard";
import { useAppSelector } from "./store/hooks";

function App() {
  const { isAuthed } = useAuth();
  const socketStatus = useAppSelector((s) => s.socket.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">Techzu - Sneaker Drop</h1>
            <p className="text-xs text-zinc-400">Real-time inventory dashboard</p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
            <LiveBadge state={socketStatus} />
            {isAuthed ? (
              <SessionBar />
            ) : (
              <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
                Not signed in
              </span>
            )}
          </div>
        </div>
      </header>

      {!isAuthed ? (
        <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
          <LoginCard />
        </main>
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-300 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200">
                i
              </span>
              <div>
                <div className="font-semibold text-zinc-100">Dev session enabled</div>
                <div className="mt-0.5 text-zinc-400">
                  Requests send <span className="font-mono">X-User-Id</span> and{" "}
                  <span className="font-mono">X-User-Name</span>.
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Dashboard />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
