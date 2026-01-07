import { useAuth } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { LiveBadge } from "./components/LiveBadge";
import { SessionBar } from "./components/SessionBar";
import { useAppSelector } from "./store/hooks";

function App() {
  const { isAuthed } = useAuth();
  const socketStatus = useAppSelector((s) => s.socket.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">Techzu - Sneaker Drop</h1>
            <p className="text-xs text-zinc-400">Real-time inventory dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            <LiveBadge state={socketStatus} />
            <SessionBar />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {!isAuthed ? (
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-sm text-zinc-300 shadow-sm">
            <div className="text-base font-semibold text-zinc-100">Sign in to continue</div>
            <p className="mt-1 text-zinc-400">
              Enter a username in the header to simulate a user session. Requests send{" "}
              <span className="font-mono">X-User-Id</span> and <span className="font-mono">X-User-Name</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300 shadow-sm">
              Session is simulated: requests send <span className="font-mono">X-User-Id</span> and{" "}
              <span className="font-mono">X-User-Name</span>.
            </div>
            <div className="mt-6">
              <Dashboard />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

