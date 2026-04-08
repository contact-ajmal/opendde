'use client';

import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/api';

interface CliffLigand {
  chembl_id: string;
  name: string;
  smiles: string;
  activity_nm: number;
  image_url: string | null;
}

interface ActivityCliff {
  ligand_a: CliffLigand;
  ligand_b: CliffLigand;
  similarity: number;
  activity_ratio: number;
}

interface ActivityCliffsProps {
  uniprotId: string;
}

function formatActivity(nm: number): string {
  if (nm >= 1_000_000) return `${(nm / 1_000_000).toFixed(1)} mM`;
  if (nm >= 1_000) return `${(nm / 1_000).toFixed(1)} µM`;
  return `${nm.toFixed(1)} nM`;
}

function ratioColor(ratio: number): string {
  if (ratio >= 100) return 'bg-red-500/20 text-red-400';
  return 'bg-amber-500/20 text-amber-400';
}

export default function ActivityCliffs({ uniprotId }: ActivityCliffsProps) {
  const [cliffs, setCliffs] = useState<ActivityCliff[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiPost(`/activity-cliffs/${uniprotId}`, {});
        setCliffs(data.cliffs || []);
      } catch {
        // silently fail — supplementary feature
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uniprotId]);

  if (loading) {
    return (
      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <div className="shimmer h-[200px] rounded-lg" />
      </div>
    );
  }

  if (cliffs.length === 0) return null;

  return (
    <div className="mb-8 rounded-lg border border-border bg-surface p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Activity Cliffs</h3>
          <span
            className="group relative cursor-help rounded-full border border-border px-1.5 text-xs text-muted"
            title="Structurally similar ligands with dramatically different activity — key SAR insights"
          >
            ?
          </span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
            {cliffs.length}
          </span>
        </div>
        <span className="text-sm text-muted">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-4">
          {cliffs.map((cliff, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-[var(--surface-alt)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Ligand A (more potent) */}
                <div className="flex-1 rounded-lg bg-surface p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cliff.ligand_a.name}</span>
                    <span className="text-xs text-muted">{cliff.ligand_a.chembl_id}</span>
                  </div>
                  {cliff.ligand_a.image_url && (
                    <img
                      src={cliff.ligand_a.image_url}
                      alt={cliff.ligand_a.name}
                      className="mb-2 h-24 w-auto rounded bg-white p-1"
                    />
                  )}
                  <div className="text-sm">
                    <span className="text-muted">IC50: </span>
                    <span className="font-medium text-emerald-400">
                      {formatActivity(cliff.ligand_a.activity_nm)}
                    </span>
                  </div>
                </div>

                {/* Middle: similarity + ratio */}
                <div className="flex flex-col items-center gap-2 px-2">
                  {/* Similarity bar */}
                  <div className="w-24 text-center">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                      Similarity
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${cliff.similarity * 100}%` }}
                      />
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-blue-400">
                      {(cliff.similarity * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Activity ratio badge */}
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold ${ratioColor(cliff.activity_ratio)}`}
                  >
                    {cliff.activity_ratio.toFixed(0)}x
                  </div>
                </div>

                {/* Ligand B (less potent) */}
                <div className="flex-1 rounded-lg bg-surface p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cliff.ligand_b.name}</span>
                    <span className="text-xs text-muted">{cliff.ligand_b.chembl_id}</span>
                  </div>
                  {cliff.ligand_b.image_url && (
                    <img
                      src={cliff.ligand_b.image_url}
                      alt={cliff.ligand_b.name}
                      className="mb-2 h-24 w-auto rounded bg-white p-1"
                    />
                  )}
                  <div className="text-sm">
                    <span className="text-muted">IC50: </span>
                    <span className="font-medium text-red-400">
                      {formatActivity(cliff.ligand_b.activity_nm)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted">
            Pairs with Tanimoto similarity &gt; 70% and activity ratio &gt; 10x.
            Higher ratios indicate stronger activity cliffs.
          </p>
        </div>
      )}
    </div>
  );
}
