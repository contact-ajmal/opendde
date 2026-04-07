'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StructureViewer from '@/components/StructureViewer';
import { apiPost } from '@/lib/api';

interface TargetInfo {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
  sequence: string;
  length: number;
  structure_source: string | null;
  structure_url: string | null;
  plddt_mean: number | null;
}

export default function TargetPage() {
  const params = useParams<{ uniprotId: string }>();
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="mx-auto max-w-6xl">
        {/* Target Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{target.name}</h1>
            {target.gene_name && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                {target.gene_name}
              </span>
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

        {/* 3D Viewer */}
        {structureUrl ? (
          <StructureViewer structureUrl={structureUrl} height="500px" />
        ) : (
          <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-surface">
            <p className="text-muted">No structure available for this target</p>
          </div>
        )}
      </div>
    </main>
  );
}
