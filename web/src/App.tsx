import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { FiActivity } from "react-icons/fi";

import { useAuth } from "./hooks/useAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { LiveBadge } from "./components/LiveBadge";
import { SessionBar } from "./components/SessionBar";
import { useAppSelector } from "./store/hooks";
import { RequireAuth } from "./routes/RequireAuth";

function AppLayout() {
  const socketStatus = useAppSelector((s) => s.socket.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-900/70 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="hidden sm:block" />

            <div className="min-w-0 sm:text-center">
              <div className="flex items-center gap-2 sm:justify-center">
                <FiActivity className="hidden text-emerald-300 sm:block" />
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  Real-Time High-Traffic Inventory System
                </h1>
              </div>
              <p className="mt-0.5 text-sm text-zinc-400">Sneaker drop dashboard with real-time sync</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 justify-self-end sm:col-start-3">
              <LiveBadge state={socketStatus} />
              <SessionBar />
            </div>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={isAuthed ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundRedirect />} />
      </Route>
    </Routes>
  );
}
