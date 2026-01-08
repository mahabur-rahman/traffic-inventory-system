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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-900/70 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">Real-Time High-Traffic Inventory System</h1>
            <p className="mt-0.5 text-sm text-zinc-400">Sneaker drop dashboard with real-time sync</p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
            <LiveBadge state={socketStatus} />
            {isAuthed ? (
              <SessionBar />
            ) : (
              <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300 shadow-sm">
                Not signed in
              </span>
            )}
          </div>
        </div>
      </header>

      {!isAuthed ? (
        <main className="relative flex min-h-[calc(100vh-104px)] items-center justify-center px-4 py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12),_rgba(0,0,0,0)_55%)]" />
          <div className="relative z-10 flex w-full justify-center">
            <LoginCard />
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-base text-zinc-300 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200">
                i
              </span>
              <div>
                <div className="font-semibold text-zinc-100">Session active</div>
                <div className="mt-0.5 text-zinc-400">You can open multiple tabs to test real-time stock sync.</div>
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
