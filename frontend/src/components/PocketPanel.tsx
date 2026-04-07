'use client';

import { motion } from 'framer-motion';
import type { PocketResult } from '@/lib/types';
import { useCountUp } from '@/hooks/useCountUp';

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

function PocketCount({ count }: { count: number }) {
  const animated = useCountUp(count);
  return <>{animated}</>;
}

function DruggabilityPct({ value }: { value: number }) {
  const animated = useCountUp(Math.round(value * 100));
  return <>{animated}%</>;
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
        <span className="text-sm text-muted"><PocketCount count={pockets.length} /> found</span>
      </div>

      {pockets.map((pocket, i) => {
        const isSelected = selectedPocket === pocket.rank;
        return (
          <motion.div
            key={pocket.rank}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
          >
            <button
              onClick={() => onSelectPocket(pocket.rank)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200 active:scale-[0.97] ${
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
                    <DruggabilityPct value={pocket.druggability} />
                  </span>
                </div>

                {/* Druggability bar */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
                  <motion.div
                    className={`h-full rounded-full ${druggabilityColor(pocket.druggability)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pocket.druggability * 100, 2)}%` }}
                    transition={{ delay: i * 0.06 + 0.2, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {pocket.residue_count} residues
                  </span>
                </div>
              </div>
            </button>
          </motion.div>
        );
      })}

      <p className="mt-2 text-center text-xs text-muted">
        Powered by P2Rank
      </p>
    </div>
  );
}
