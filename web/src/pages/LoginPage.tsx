import { LoginCard } from "../components/LoginCard";

export function LoginPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12),_rgba(0,0,0,0)_55%)]" />
      <div className="relative z-10 flex w-full justify-center">
        <LoginCard />
      </div>
    </main>
  );
}

