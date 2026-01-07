import { useAuth } from "./hooks/useAuth";
import { LoginCard } from "./components/LoginCard";
import { Dashboard } from "./pages/Dashboard";
import { SessionBar } from "./components/SessionBar";
import { LiveBadge } from "./components/LiveBadge";
import { useAppSelector } from "./store/hooks";

function App() {
  const { isAuthed } = useAuth();
  const socketStatus = useAppSelector((s) => s.socket.status);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Techzu – Sneaker Drop</h1>
            <p className="text-xs text-zinc-400">Dashboard (function over form)</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <LiveBadge state={socketStatus} />
            <span className="text-zinc-700">|</span>
            <SessionBar />
          </div>
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
