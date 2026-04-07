'use client';

import { useEffect, useRef, useState } from 'react';

const THREEDMOL_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.4.0/3Dmol-min.js';

interface Highlight {
  residues: number[];
  chain: string;
  color: string;
}

interface FocusResidue {
  x: number;
  y: number;
  z: number;
}

interface StructureViewerProps {
  structureUrl: string;
  height?: string;
  highlights?: Highlight[];
  focusResidue?: FocusResidue;
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

export default function StructureViewer({
  structureUrl,
  height = '500px',
  highlights,
  focusResidue,
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

        // Clear any previous viewer
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

  // Highlights
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !highlights) return;

    viewer.removeAllSurfaces();
    for (const h of highlights) {
      viewer.addSurface(
        window.$3Dmol.SurfaceType.VDW,
        { opacity: 0.7, color: h.color },
        { resi: h.residues, chain: h.chain }
      );
    }
    viewer.render();
  }, [highlights]);

  // Focus residue
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !focusResidue) return;

    viewer.center(
      { x: focusResidue.x, y: focusResidue.y, z: focusResidue.z },
      1000
    );
    viewer.zoomTo(
      { x: focusResidue.x, y: focusResidue.y, z: focusResidue.z },
      1000
    );
    viewer.render();
  }, [focusResidue]);

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
