'use client';

import { useEffect, useRef, useState } from 'react';

const THREEDMOL_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.4.0/3Dmol-min.js';

const POCKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

export interface PocketHighlight {
  rank: number;
  residues: string[]; // P2Rank format: "A_123" or "ALA_123_A"
  selected: boolean;
}

interface FocusPoint {
  x: number;
  y: number;
  z: number;
}

interface StructureViewerProps {
  structureUrl: string;
  height?: string;
  pocketHighlights?: PocketHighlight[];
  focusPoint?: FocusPoint;
  onReady?: () => void;
}

function load3Dmol(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.$3Dmol) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = THREEDMOL_CDN;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
    document.head.appendChild(script);
  });
}

/** Parse P2Rank residue ID like "A_123" or "ALA_123_A" into { resi, chain } */
function parseResidue(id: string): { resi: number; chain: string } | null {
  const parts = id.split('_');
  if (parts.length === 2) {
    // Format: "A_123" (chain_resi)
    return { chain: parts[0], resi: parseInt(parts[1], 10) };
  }
  if (parts.length === 3) {
    // Format: "ALA_123_A" (name_resi_chain)
    return { chain: parts[2], resi: parseInt(parts[1], 10) };
  }
  return null;
}

function getPocketColor(rank: number): string {
  return POCKET_COLORS[Math.min(rank - 1, POCKET_COLORS.length - 1)];
}

export default function StructureViewer({
  structureUrl,
  height = '500px',
  pocketHighlights,
  focusPoint,
  onReady,
}: StructureViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mount: load 3Dmol, fetch structure, create viewer
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await load3Dmol();
        if (cancelled || !containerRef.current) return;

        const resp = await fetch(structureUrl);
        if (!resp.ok) throw new Error(`Failed to fetch structure: ${resp.status}`);
        const data = await resp.text();
        if (cancelled) return;

        const format = structureUrl.endsWith('.cif') ? 'cif' : 'pdb';

        if (viewerRef.current) {
          viewerRef.current.clear();
          viewerRef.current = null;
        }
        containerRef.current.innerHTML = '';

        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#0f172a',
        });
        viewerRef.current = viewer;

        viewer.addModel(data, format);
        viewer.setStyle({}, { cartoon: { colorscheme: 'spectral' } });
        viewer.zoomTo();
        viewer.render();

        setLoading(false);
        onReady?.();
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load structure');
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [structureUrl]);

  // Pocket highlights
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !pocketHighlights) return;

    viewer.removeAllSurfaces();

    for (const pocket of pocketHighlights) {
      const parsed = pocket.residues.map(parseResidue).filter(Boolean) as {
        resi: number;
        chain: string;
      }[];
      if (parsed.length === 0) continue;

      // Group by chain
      const byChain: Record<string, number[]> = {};
      for (const { resi, chain } of parsed) {
        if (!byChain[chain]) byChain[chain] = [];
        byChain[chain].push(resi);
      }

      const color = getPocketColor(pocket.rank);
      const opacity = pocket.selected ? 0.8 : 0.3;

      for (const [chain, residues] of Object.entries(byChain)) {
        viewer.addSurface(
          window.$3Dmol.SurfaceType.VDW,
          { opacity, color },
          { resi: residues, chain }
        );
      }
    }

    viewer.render();
  }, [pocketHighlights]);

  // Focus point
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !focusPoint) return;

    viewer.center(focusPoint, 1000);
    viewer.zoomTo(focusPoint, 1000);
    viewer.render();
  }, [focusPoint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.clear();
        viewerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10"
        style={{ height }}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg border border-border overflow-hidden" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
