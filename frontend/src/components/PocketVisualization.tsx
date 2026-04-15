'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { PocketHighlight } from '@/components/MolstarViewer';
import type { PocketVisMode } from '@/components/PocketModeSelector';
import type { PocketResult, PocketProperties } from '@/lib/types';

/* ── Color maps for each visualization mode ─────────────── */

// Druggability: green gradient based on druggability score
function druggabilityColor(druggability: number): string {
  if (druggability >= 0.7) return '#10b981';
  if (druggability >= 0.4) return '#f59e0b';
  return '#ef4444';
}

// Hydrophobicity: amber for hydrophobic, blue for polar, purple for charged, pink for aromatic
const HYDRO_COLORS: Record<string, string> = {
  hydrophobic: '#f59e0b',
  polar: '#3b82f6',
  charged_positive: '#a855f7',
  charged_negative: '#ec4899',
  aromatic: '#f97316',
};

// Electrostatics: red = negative, blue = positive, gray = neutral
const CHARGE_COLORS: Record<string, string> = {
  charged_positive: '#3b82f6',
  charged_negative: '#ef4444',
  hydrophobic: '#64748b',
  polar: '#94a3b8',
  aromatic: '#94a3b8',
};

// H-bonds: green = donor, purple = acceptor
const HBOND_DONORS = new Set(['S', 'T', 'N', 'Q', 'Y', 'W', 'K', 'R', 'H', 'C']);
const HBOND_ACCEPTORS = new Set(['S', 'T', 'N', 'Q', 'D', 'E', 'Y', 'H']);
const THREE_TO_ONE: Record<string, string> = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
  GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
  LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
  SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
};

interface PocketVisualizationProps {
  pocket: PocketResult;
  uniprotId: string;
  mode: PocketVisMode;
}

/**
 * Generates pocket highlight overlays colored by the selected visualization mode.
 * Returns PocketHighlight[] to pass to MolstarViewer.
 */
export function usePocketVisualization({ pocket, uniprotId, mode }: PocketVisualizationProps): PocketHighlight[] {
  const [properties, setProperties] = useState<PocketProperties | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet(`/pocket/${uniprotId}/${pocket.rank}/properties`)
      .then((data) => { if (!cancelled) setProperties(data as PocketProperties); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uniprotId, pocket.rank]);

  return useMemo(() => {
    if (!properties) {
      // Fallback: single pocket highlight with default coloring
      return [{ rank: pocket.rank, residues: pocket.residues, selected: true }];
    }

    switch (mode) {
      case 'druggability':
        return [{
          rank: pocket.rank,
          residues: pocket.residues,
          selected: true,
          color: druggabilityColor(properties.druggability),
        }];

      case 'hydrophobicity':
      case 'electrostatics':
      case 'contacts': {
        const colorMap = mode === 'electrostatics' ? CHARGE_COLORS : HYDRO_COLORS;
        // Group residues by type and create separate highlights per type
        const highlights: PocketHighlight[] = [];
        let pseudoRank = 1;
        for (const [type, residues] of Object.entries(properties.residues_by_type)) {
          if (residues.length === 0) continue;
          highlights.push({
            rank: pseudoRank++,
            residues,
            selected: true,
            color: colorMap[type] || '#64748b',
          });
        }
        return highlights.length > 0 ? highlights : [{
          rank: pocket.rank, residues: pocket.residues, selected: true,
        }];
      }

      case 'hbonds': {
        // Split residues into donors (green) and acceptors (purple)
        const donors: string[] = [];
        const acceptors: string[] = [];
        const neither: string[] = [];

        for (const res of pocket.residues) {
          const parts = res.split('_');
          const threeCode = parts.length === 3 ? parts[0] : null;
          const oneLetter = threeCode ? THREE_TO_ONE[threeCode.toUpperCase()] : null;

          if (oneLetter) {
            const isDonor = HBOND_DONORS.has(oneLetter);
            const isAcceptor = HBOND_ACCEPTORS.has(oneLetter);
            if (isDonor && isAcceptor) {
              donors.push(res);
              acceptors.push(res);
            } else if (isDonor) {
              donors.push(res);
            } else if (isAcceptor) {
              acceptors.push(res);
            } else {
              neither.push(res);
            }
          } else {
            neither.push(res);
          }
        }

        const highlights: PocketHighlight[] = [];
        if (donors.length > 0)
          highlights.push({ rank: 1, residues: donors, selected: true, color: '#10b981' });
        if (acceptors.length > 0)
          highlights.push({ rank: 2, residues: acceptors, selected: true, color: '#a855f7' });
        if (neither.length > 0)
          highlights.push({ rank: 3, residues: neither, selected: true, color: '#64748b' });
        return highlights.length > 0 ? highlights : [{
          rank: pocket.rank, residues: pocket.residues, selected: true,
        }];
      }

      case 'depth':
        // Depth mode: single color based on enclosure ratio
        return [{
          rank: pocket.rank,
          residues: pocket.residues,
          selected: true,
          color: properties.enclosure_ratio >= 0.7 ? '#6366f1' :
                 properties.enclosure_ratio >= 0.5 ? '#8b5cf6' : '#c084fc',
        }];

      default:
        return [{ rank: pocket.rank, residues: pocket.residues, selected: true }];
    }
  }, [pocket, properties, mode]);
}

/* ── Legend component for each mode ──────────────────────── */

interface LegendProps {
  mode: PocketVisMode;
}

const LEGENDS: Record<PocketVisMode, { color: string; label: string }[]> = {
  druggability: [
    { color: '#10b981', label: 'High (>70%)' },
    { color: '#f59e0b', label: 'Moderate (40-70%)' },
    { color: '#ef4444', label: 'Low (<40%)' },
  ],
  hydrophobicity: [
    { color: '#f59e0b', label: 'Hydrophobic' },
    { color: '#3b82f6', label: 'Polar' },
    { color: '#a855f7', label: 'Charged +' },
    { color: '#ec4899', label: 'Charged −' },
    { color: '#f97316', label: 'Aromatic' },
  ],
  electrostatics: [
    { color: '#3b82f6', label: 'Positive' },
    { color: '#ef4444', label: 'Negative' },
    { color: '#64748b', label: 'Hydrophobic' },
    { color: '#94a3b8', label: 'Neutral' },
  ],
  hbonds: [
    { color: '#10b981', label: 'H-bond donor' },
    { color: '#a855f7', label: 'H-bond acceptor' },
    { color: '#64748b', label: 'Neither' },
  ],
  depth: [
    { color: '#6366f1', label: 'Deep (>70% enclosed)' },
    { color: '#8b5cf6', label: 'Medium (50-70%)' },
    { color: '#c084fc', label: 'Shallow (<50%)' },
  ],
  contacts: [
    { color: '#f59e0b', label: 'Hydrophobic' },
    { color: '#3b82f6', label: 'Polar' },
    { color: '#a855f7', label: 'Charged +' },
    { color: '#ec4899', label: 'Charged −' },
    { color: '#f97316', label: 'Aromatic' },
  ],
};

export function PocketVisLegend({ mode }: LegendProps) {
  const items = LEGENDS[mode];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
