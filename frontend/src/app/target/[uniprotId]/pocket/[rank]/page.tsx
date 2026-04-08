'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { PocketHighlight } from '@/components/StructureViewer';
import LigandTable from '@/components/LigandTable';
import PredictionWorkflow from '@/components/PredictionWorkflow';
import AnimatedLayout from '@/components/AnimatedLayout';
import CustomLigandSection from '@/components/CustomLigandSection';
import PocketMap from '@/components/PocketMap';
import SuggestionsPanel from '@/components/SuggestionsPanel';
import ActivityCliffs from '@/components/ActivityCliffs';
import { useAssistant } from '@/components/AssistantContext';
import { apiPost, apiGet } from '@/lib/api';
import type { TargetInfo, PocketResult, PocketsResponse, KnownLigand, LigandsResponse } from '@/lib/types';

const StructureViewer = dynamic(() => import('@/components/StructureViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-[500px] w-full rounded-lg" />,
});

const SARPlot = dynamic(() => import('@/components/SARPlot'), {
  loading: () => <div className="shimmer h-[350px] w-full rounded-lg mb-8" />,
});

const MoleculeEditor = dynamic(() => import('@/components/MoleculeEditor'), {
  ssr: false,
  loading: () => <div className="shimmer h-[380px] w-full rounded-lg" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PocketDetailPage() {
  const params = useParams<{ uniprotId: string; rank: string }>();
  const rankNum = parseInt(params.rank, 10);

  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [pocket, setPocket] = useState<PocketResult | null>(null);
  const [ligands, setLigands] = useState<KnownLigand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prediction workflow state
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedLigand, setSelectedLigand] = useState<{ smiles: string; name: string } | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const { setContext } = useAssistant();

  // Update page title
  useEffect(() => {
    if (target) {
      document.title = `${target.gene_name || target.name} Pocket ${rankNum} — OpenDDE`;
    }
  }, [target, rankNum]);

  // Update assistant context when data loads
  useEffect(() => {
    if (!target || !pocket) return;
    const approved = ligands.filter(l => l.clinical_phase >= 4).length;
    const ic50vals = ligands.map(l => l.activity_value_nm).filter(Boolean);
    setContext({
      page: 'pocket_detail',
      target: {
        name: target.name,
        uniprot_id: target.uniprot_id,
        organism: target.organism,
        length: target.length,
        gene_name: target.gene_name,
        plddt_mean: target.plddt_mean,
      },
      current_pocket: {
        rank: pocket.rank,
        score: pocket.score,
        druggability: pocket.druggability,
        residue_count: pocket.residue_count,
      },
      known_ligands_summary: {
        total: ligands.length,
        approved,
        best_ic50: ic50vals.length > 0 ? Math.min(...ic50vals) : null,
      },
    });
  }, [target, pocket, ligands, setContext]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [targetData, pocketsData, ligandsData] = await Promise.all([
          apiPost('/target/resolve', { query: params.uniprotId }),
          apiPost('/pockets', { uniprot_id: params.uniprotId }),
          apiGet(`/ligands/${params.uniprotId}`),
        ]) as [TargetInfo, PocketsResponse, LigandsResponse];

        setTarget(targetData);
        setLigands(ligandsData.ligands);

        const found = pocketsData.pockets.find((p) => p.rank === rankNum);
        if (!found) {
          setError(`Pocket #${rankNum} not found`);
        } else {
          setPocket(found);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [params.uniprotId, rankNum]);

  const pocketHighlights: PocketHighlight[] = useMemo(() => {
    if (!pocket) return [];
    return [{ rank: pocket.rank, residues: pocket.residues, selected: true }];
  }, [pocket]);

  const focusPoint = useMemo(() => {
    if (!pocket) return undefined;
    return { x: pocket.center_x, y: pocket.center_y, z: pocket.center_z };
  }, [pocket]);

  function handlePredictComplex(lig: KnownLigand) {
    setSelectedLigand({ smiles: lig.smiles, name: lig.name });
    setWorkflowOpen(true);
  }



  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted">Loading pocket details…</p>
        </div>
      </main>
    );
  }

  if (error || !target || !pocket) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error || 'Not found'}</p>
          <Link href={`/target/${params.uniprotId}`} className="text-primary hover:underline">
            ← Back to all pockets
          </Link>
        </div>
      </main>
    );
  }

  const structureUrl = target.structure_url
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${target.structure_url}`
    : null;

  const druggPct = (pocket.druggability * 100).toFixed(0);
  const druggColor =
    pocket.druggability >= 0.7
      ? 'text-emerald-400'
      : pocket.druggability >= 0.4
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <AnimatedLayout><main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/target/${params.uniprotId}`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to all pockets
          </Link>
          <div className="mt-2 flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">
              Pocket #{pocket.rank}{' '}
              <span className="text-lg font-normal text-muted">for {target.name}</span>
            </h1>

            {/* Export dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                aria-label="Export data"
                aria-expanded={exportOpen}
                className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
              >
                Export ▾
              </button>
              {exportOpen && (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-surface py-1 shadow-lg">
                  {target.structure_url && (
                    <a
                      href={`${API_BASE}${target.structure_url}`}
                      download
                      className="block px-4 py-2 text-sm text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                      onClick={() => setExportOpen(false)}
                    >
                      Download structure (CIF)
                    </a>
                  )}
                  <a
                    href={`${API_BASE}/api/v1/export/pockets/${params.uniprotId}`}
                    download
                    className="block px-4 py-2 text-sm text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                    onClick={() => setExportOpen(false)}
                  >
                    Download pockets (CSV)
                  </a>
                  <a
                    href={`${API_BASE}/api/v1/export/ligands/${params.uniprotId}`}
                    download
                    className="block px-4 py-2 text-sm text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                    onClick={() => setExportOpen(false)}
                  >
                    Download ligands (CSV)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two columns: viewer + pocket info */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-[55%] md:flex-shrink-0">
            {structureUrl ? (
              <StructureViewer
                structureUrl={structureUrl}
                height="500px"
                pocketHighlights={pocketHighlights}
                focusPoint={focusPoint}
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-surface">
                <p className="text-muted">No structure available</p>
              </div>
            )}
          </div>

          <div className="w-full md:w-[45%] md:flex-shrink-0">
            <div className="glass-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Pocket Details</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted">Score</span>
                  <span className="font-medium text-foreground">{pocket.score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Druggability</span>
                  <span className={`font-medium ${druggColor}`}>{druggPct}%</span>
                </div>
                <div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-alt)]">
                    <div
                      className={`h-full rounded-full ${
                        pocket.druggability >= 0.7
                          ? 'bg-emerald-500'
                          : pocket.druggability >= 0.4
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(pocket.druggability * 100, 2)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Residues</span>
                  <span className="font-medium text-foreground">{pocket.residue_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Center</span>
                  <span className="font-mono text-xs text-foreground">
                    ({pocket.center_x.toFixed(1)}, {pocket.center_y.toFixed(1)}, {pocket.center_z.toFixed(1)})
                  </span>
                </div>

                <div>
                  <span className="text-sm text-muted">Residue list</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pocket.residues.slice(0, 30).map((r) => (
                      <span
                        key={r}
                        className="rounded bg-[var(--surface-alt)] px-1.5 py-0.5 text-xs text-muted"
                      >
                        {r}
                      </span>
                    ))}
                    {pocket.residues.length > 30 && (
                      <span className="text-xs text-muted">
                        +{pocket.residues.length - 30} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted">Powered by P2Rank</p>
            </div>

            {/* Pocket residue interaction map */}
            <div className="mt-4 glass-panel p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Residue Interaction Map</h3>
              <PocketMap
                uniprotId={params.uniprotId}
                rank={pocket.rank}
                druggability={pocket.druggability}
              />
            </div>
          </div>
        </div>

        {/* SAR scatter plot */}
        {ligands.length >= 2 && (
          <SARPlot ligands={ligands} />
        )}

        {/* Activity cliffs */}
        {ligands.length >= 2 && (
          <ActivityCliffs uniprotId={params.uniprotId} />
        )}

        {/* Ligand table */}
        {ligands.length > 0 && (
          <div className="mb-8">
            <LigandTable ligands={ligands} onPredictComplex={handlePredictComplex} />
          </div>
        )}

        {/* AI-suggested modifications */}
        {ligands.length > 0 && (
          <div className="mb-8">
            <SuggestionsPanel
              uniprotId={params.uniprotId}
              pocket={pocket}
              ligands={ligands}
              onTestMolecule={(smiles, name) => {
                setSelectedLigand({ smiles, name });
                setWorkflowOpen(true);
              }}
            />
          </div>
        )}

        {/* Custom ligand with SMILES input + molecule editor */}
        <CustomLigandSection onPredict={(smiles, name) => {
          setSelectedLigand({ smiles, name });
          setWorkflowOpen(true);
        }} />
      </div>

      {/* Prediction workflow modal */}
      {target && (
        <PredictionWorkflow
          isOpen={workflowOpen}
          onClose={() => setWorkflowOpen(false)}
          targetInfo={target}
          ligand={selectedLigand}
        />
      )}
    </main></AnimatedLayout>
  );
}
