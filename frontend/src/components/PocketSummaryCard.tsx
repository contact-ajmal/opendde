'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PocketResult, TargetInfo } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PocketSummaryCardProps {
  target: TargetInfo;
  pockets: PocketResult[];
  ligandCount?: number;
}

export default function PocketSummaryCard({ target, pockets, ligandCount = 0 }: PocketSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSummary = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError(false);
    try {
      const resp = await fetch(`${API_BASE}/api/v1/assistant/pocket-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniprot_id: target.uniprot_id,
          target_name: target.name,
          pockets: pockets.map(p => ({
            rank: p.rank,
            score: p.score,
            druggability: p.druggability,
            residue_count: p.residue_count,
          })),
          ligand_count: ligandCount,
          regenerate,
        }),
      });
      if (!resp.ok) {
        setError(true);
        return;
      }
      const data = await resp.json();
      setSummary(data.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [target, pockets, ligandCount]);

  useEffect(() => {
    if (pockets.length > 0) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [pockets.length, fetchSummary]);

  if (pockets.length === 0) return null;

  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-lg border-l-2 border-l-emerald-500 border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">&#10024;</span>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            AI Analysis
          </span>
        </div>
        {summary && !loading && (
          <button
            onClick={() => fetchSummary(true)}
            className="rounded px-2 py-0.5 text-xs text-muted hover:text-foreground transition-colors"
            title="Regenerate analysis"
          >
            Regenerate
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-4 w-3/4 rounded" />
          <p className="text-xs text-muted mt-1">Analyzing pockets...</p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      )}
    </motion.div>
  );
}
