'use client';

import type { PocketResult } from '@/lib/types';

interface PocketPanelProps {
  pockets: PocketResult[];
  selectedPocket: number | null;
  onSelectPocket: (rank: number) => void;
  uniprotId: string;
}

function druggabilityColor(d: number): string {
  if (d >= 0.7) return 'bg-emerald-500';
  if (d >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

function druggabilityLabel(d: number): string {
  if (d >= 0.7) return 'text-emerald-400';
  if (d >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

export default function PocketPanel({
  pockets,
  selectedPocket,
  onSelectPocket,
}: PocketPanelProps) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">
          Binding Pockets
        </h2>
        <span className="text-sm text-muted">{pockets.length} found</span>
      </div>

      {pockets.map((pocket) => {
        const isSelected = selectedPocket === pocket.rank;
        return (
          <button
            key={pocket.rank}
            onClick={() => onSelectPocket(pocket.rank)}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border bg-surface hover:border-[var(--border-hover)]'
            }`}
          >
            {/* Rank badge */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold text-foreground">
              {pocket.rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Score: {pocket.score.toFixed(1)}
                </span>
                <span className={`text-xs font-medium ${druggabilityLabel(pocket.druggability)}`}>
                  {(pocket.druggability * 100).toFixed(0)}%
                </span>
              </div>

              {/* Druggability bar */}
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
                <div
                  className={`h-full rounded-full ${druggabilityColor(pocket.druggability)}`}
                  style={{ width: `${Math.max(pocket.druggability * 100, 2)}%` }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {pocket.residue_count} residues
                </span>
              </div>
            </div>
          </button>
        );
      })}

      <p className="mt-2 text-center text-xs text-muted">
        Powered by P2Rank
      </p>
    </div>
  );
}
