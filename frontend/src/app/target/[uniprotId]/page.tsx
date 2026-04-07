'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StructureViewer, { type PocketHighlight } from '@/components/StructureViewer';
import PocketPanel from '@/components/PocketPanel';
import { apiPost, apiGet } from '@/lib/api';
import type { TargetInfo, PocketResult, PocketsResponse } from '@/lib/types';

export default function TargetPage() {
  const params = useParams<{ uniprotId: string }>();
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pockets, setPockets] = useState<PocketResult[]>([]);
  const [pocketsLoading, setPocketsLoading] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState<number | null>(null);
  const [hasPredictions, setHasPredictions] = useState(false);

  // Resolve target
  useEffect(() => {
    async function resolve() {
      try {
        const data = await apiPost('/target/resolve', { query: params.uniprotId });
        setTarget(data);
      } catch (err: any) {
        setError(err.message || 'Failed to resolve target');
      } finally {
        setLoading(false);
      }
    }
    resolve();
  }, [params.uniprotId]);

  // Fetch pockets after target resolved
  useEffect(() => {
    if (!target?.uniprot_id) return;

    async function fetchPockets() {
      setPocketsLoading(true);
      try {
        const data: PocketsResponse = await apiPost('/pockets', {
          uniprot_id: target!.uniprot_id,
        });
        setPockets(data.pockets);
        if (data.pockets.length > 0) {
          setSelectedPocket(data.pockets[0].rank);
        }
      } catch {
        // Pockets are optional — don't block the page
      } finally {
        setPocketsLoading(false);
      }
    }
    fetchPockets();

    // Check for predictions
    apiGet(`/target/${target!.uniprot_id}/predictions`)
      .then((data: any) => {
        if (data.predictions?.length > 0) setHasPredictions(true);
      })
      .catch(() => {});
  }, [target?.uniprot_id]);

  // Build pocket highlights for the viewer
  const pocketHighlights: PocketHighlight[] = useMemo(() => {
    return pockets.map((p) => ({
      rank: p.rank,
      residues: p.residues,
      selected: selectedPocket === p.rank,
    }));
  }, [pockets, selectedPocket]);

  // Focus point for selected pocket
  const focusPoint = useMemo(() => {
    if (selectedPocket == null) return undefined;
    const pocket = pockets.find((p) => p.rank === selectedPocket);
    if (!pocket) return undefined;
    return { x: pocket.center_x, y: pocket.center_y, z: pocket.center_z };
  }, [pockets, selectedPocket]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted">Resolving target…</p>
        </div>
      </main>
    );
  }

  if (error || !target) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error || 'Target not found'}</p>
          <Link href="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const structureUrl = target.structure_url
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${target.structure_url}`
    : null;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Target Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{target.name}</h1>
            {target.gene_name && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                {target.gene_name}
              </span>
            )}
            {hasPredictions && (
              <Link
                href={`/target/${target.uniprot_id}/compare`}
                className="ml-auto rounded-lg bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Compare ligands
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="italic text-muted">{target.organism}</span>
            <span className="text-muted">{target.length} amino acids</span>
            {target.structure_source && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  target.structure_source === 'alphafold_db'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {target.structure_source === 'alphafold_db' ? 'AlphaFold' : 'PDB'}
              </span>
            )}
            {target.plddt_mean != null && (
              <span className="text-muted">
                pLDDT: {target.plddt_mean.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Two-column layout: viewer + pocket panel */}
        <div className="flex gap-6">
          {/* 3D Viewer (70%) */}
          <div className="w-[70%] flex-shrink-0">
            {structureUrl ? (
              <StructureViewer
                structureUrl={structureUrl}
                height="600px"
                pocketHighlights={pocketHighlights}
                focusPoint={focusPoint}
              />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-surface">
                <p className="text-muted">No structure available for this target</p>
              </div>
            )}
          </div>

          {/* Pocket Panel sidebar (30%) */}
          <div className="w-[30%] flex-shrink-0">
            {pocketsLoading ? (
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Binding Pockets
                </h2>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg border border-border bg-surface"
                  />
                ))}
                <p className="mt-2 text-center text-xs text-muted">
                  Running P2Rank prediction…
                </p>
              </div>
            ) : pockets.length > 0 ? (
              <PocketPanel
                pockets={pockets}
                selectedPocket={selectedPocket}
                onSelectPocket={setSelectedPocket}
                uniprotId={target.uniprot_id}
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface">
                <p className="text-sm text-muted">No pockets detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
