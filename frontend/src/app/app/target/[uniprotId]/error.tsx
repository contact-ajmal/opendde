'use client';

export default function TargetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-600"
          >
            Try again
          </button>
          <a
            href="/app/dashboard"
            className="rounded-lg border border-border px-6 py-2 font-medium text-foreground hover:bg-surface"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
