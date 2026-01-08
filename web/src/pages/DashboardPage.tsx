import { Dashboard } from "./Dashboard";
import { SessionBanner } from "../components/SessionBanner";

export function DashboardPage() {
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
      <SessionBanner />
      <div className="mt-6">
        <Dashboard />
      </div>
    </main>
  );
}
