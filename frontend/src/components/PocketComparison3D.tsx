'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PocketHighlight } from '@/components/MolstarViewer';
import type { PocketResult } from '@/lib/types';

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PocketComparison3DProps {
  structureUrl: string;
  pockets: PocketResult[];
  currentRank: number;
}

const POCKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

export default function PocketComparison3D({ structureUrl, pockets, currentRank }: PocketComparison3DProps) {
  const [compareRank, setCompareRank] = useState<number | null>(null);
  const otherPockets = pockets.filter((p) => p.rank !== currentRank);

  const currentPocket = pockets.find((p) => p.rank === currentRank);

  const leftHighlights: PocketHighlight[] = useMemo(() => {
    if (!currentPocket) return [];
    return [{ rank: currentPocket.rank, residues: currentPocket.residues, selected: true }];
  }, [currentPocket]);

  const rightHighlights: PocketHighlight[] = useMemo(() => {
    if (!compareRank) return [];
    const p = pockets.find((pk) => pk.rank === compareRank);
    if (!p) return [];
    return [{ rank: p.rank, residues: p.residues, selected: true, color: '#3b82f6' }];
  }, [compareRank, pockets]);

  const leftFocus = useMemo(() => {
    if (!currentPocket) return undefined;
    return { x: currentPocket.center_x, y: currentPocket.center_y, z: currentPocket.center_z };
  }, [currentPocket]);

  const rightFocus = useMemo(() => {
    if (!compareRank) return undefined;
    const p = pockets.find((pk) => pk.rank === compareRank);
    if (!p) return undefined;
    return { x: p.center_x, y: p.center_y, z: p.center_z };
  }, [compareRank, pockets]);

  const rightPocket = compareRank ? pockets.find((p) => p.rank === compareRank) : null;
  const fullUrl = structureUrl.startsWith('http') ? structureUrl : `${API_BASE}${structureUrl}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Pocket selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Compare with
        </span>
        <div className="flex items-center gap-1">
          {otherPockets.map((p) => (
            <button
              key={p.rank}
              onClick={() => setCompareRank(compareRank === p.rank ? null : p.rank)}
              className={`flex h-7 items-center gap-1.5 rounded border px-2 text-[11px] font-medium transition-colors ${
                compareRank === p.rank
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                  : 'border-[var(--border)] bg-[var(--bg)] text-muted hover:text-foreground hover:border-[var(--border-hover)]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: POCKET_COLORS[Math.min(p.rank - 1, POCKET_COLORS.length - 1)] }}
              />
              Pocket #{p.rank}
              <span className="text-[10px] text-muted-2">{p.score.toFixed(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-side viewers */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left: current pocket */}
        <div className="flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400">
              Pocket #{currentRank}
            </span>
            {currentPocket && (
              <span className="text-[10px] tabular-nums text-muted">
                Score {currentPocket.score.toFixed(1)} · {currentPocket.residue_count} res
              </span>
            )}
          </div>
          <div className="h-[300px] rounded-lg overflow-hidden border border-[var(--border)]">
            <StructureViewer
              structureUrl={fullUrl}
              height="100%"
              pocketHighlights={leftHighlights}
              focusPoint={leftFocus}
            />
          </div>
        </div>

        {/* Right: comparison pocket */}
        <div className="flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-400">
              {compareRank ? `Pocket #${compareRank}` : 'Select a pocket'}
            </span>
            {rightPocket && (
              <span className="text-[10px] tabular-nums text-muted">
                Score {rightPocket.score.toFixed(1)} · {rightPocket.residue_count} res
              </span>
            )}
          </div>
          <div className="h-[300px] rounded-lg overflow-hidden border border-[var(--border)]">
            {compareRank ? (
              <StructureViewer
                structureUrl={fullUrl}
                height="100%"
                pocketHighlights={rightHighlights}
                focusPoint={rightFocus}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--bg)]">
                <p className="text-xs text-muted-2">Select a pocket above to compare</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison stats */}
      {rightPocket && currentPocket && (
        <div className="grid grid-cols-4 gap-2">
          <CompStat label="Score" left={currentPocket.score.toFixed(1)} right={rightPocket.score.toFixed(1)} />
          <CompStat
            label="Druggability"
            left={`${Math.round(currentPocket.druggability * 100)}%`}
            right={`${Math.round(rightPocket.druggability * 100)}%`}
          />
          <CompStat label="Residues" left={`${currentPocket.residue_count}`} right={`${rightPocket.residue_count}`} />
          <CompStat
            label="Volume est."
            left={`${(currentPocket.residue_count * 125).toLocaleString()} A3`}
            right={`${(rightPocket.residue_count * 125).toLocaleString()} A3`}
          />
        </div>
      )}
    </div>
  );
}

function CompStat({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg)] p-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-2 mb-1">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tabular-nums text-emerald-400">{left}</span>
        <span className="text-[9px] text-muted-2">vs</span>
        <span className="text-[11px] font-semibold tabular-nums text-blue-400">{right}</span>
      </div>
    </div>
  );
}
