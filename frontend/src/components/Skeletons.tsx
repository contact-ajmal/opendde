export function StructureViewerSkeleton({ height = '500px' }: { height?: string }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-border bg-[var(--skeleton)]"
      style={{ height }}
    />
  );
}

export function PocketPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 h-6 w-32 animate-pulse rounded bg-[var(--skeleton)]" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-lg border border-border bg-[var(--skeleton)]"
        />
      ))}
      <p className="mt-2 text-center text-xs text-muted">Running P2Rank prediction…</p>
    </div>
  );
}

export function LigandTableSkeleton() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--skeleton)]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--skeleton)]" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border bg-surface px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-[var(--skeleton)]" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-border px-4 py-4 last:border-0">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--skeleton)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
