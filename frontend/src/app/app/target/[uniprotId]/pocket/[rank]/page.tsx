'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Check,
  X as XIcon,
  Loader2,
  Pencil,
  Beaker,
  ScatterChart,
  TrendingUp,
  Sparkles,
  Download,
  Link2,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import type { PocketHighlight } from '@/components/MolstarViewer';
import PocketMap from '@/components/PocketMap';
import PocketModeSelector from '@/components/PocketModeSelector';
import type { PocketVisMode } from '@/components/PocketModeSelector';
import { usePocketVisualization } from '@/components/PocketVisualization';
import PocketPropertiesPanel from '@/components/PocketPropertiesPanel';
import ActivityCliffs from '@/components/ActivityCliffs';
import SuggestionsPanel from '@/components/SuggestionsPanel';
import PredictionWorkflow from '@/components/PredictionWorkflow';
import { useAssistant } from '@/components/AssistantContext';
import { apiPost, apiGet } from '@/lib/api';
import type {
  TargetInfo,
  PocketResult,
  PocketsResponse,
  KnownLigand,
  LigandsResponse,
  Prediction,
  InteractionsResponse,
} from '@/lib/types';

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />,
});

const SARPlot = dynamic(() => import('@/components/SARPlot'), {
  loading: () => <div className="shimmer h-full w-full rounded" />,
});

const PocketComparison3D = dynamic(() => import('@/components/PocketComparison3D'), {
  ssr: false,
  loading: () => <div className="shimmer h-[300px] w-full rounded" />,
});

const InteractionView = dynamic(() => import('@/components/InteractionView'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full rounded" />,
});

const InteractionDiagram2D = dynamic(() => import('@/components/InteractionDiagram2D'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full rounded" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Helpers ──────────────────────────────────────────── */
const propsCache = new Map<string, boolean | null>();

function formatActivity(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mM`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} \u00B5M`;
  return `${v.toFixed(1)} nM`;
}

function phaseDotColor(p: number): string {
  if (p >= 4) return 'bg-emerald-500';
  if (p === 3) return 'bg-blue-500';
  if (p === 2) return 'bg-amber-500';
  if (p === 1) return 'bg-orange-500';
  return 'bg-[var(--border)]';
}

function activityTypeColor(t: string): string {
  switch (t) {
    case 'IC50': return 'text-blue-400';
    case 'Ki': return 'text-purple-400';
    case 'Kd': return 'text-amber-400';
    default: return 'text-muted-2';
  }
}

function druggabilityText(d: number): string {
  if (d >= 0.7) return 'text-emerald-400';
  if (d >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

function druggabilityBg(d: number): string {
  if (d >= 0.7) return 'bg-emerald-500';
  if (d >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

/* ── Types ────────────────────────────────────────────── */
type Tab = 'properties' | 'ligands' | 'sar' | 'cliffs' | 'ai' | 'interactions';
type SortKey = 'name' | 'activity_value_nm' | 'clinical_phase';

/* ── Main page ────────────────────────────────────────── */
export default function PocketDetailPage() {
  const params = useParams<{ uniprotId: string; rank: string }>();
  const rankNum = parseInt(params.rank, 10);

  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [pocket, setPocket] = useState<PocketResult | null>(null);
  const [ligands, setLigands] = useState<KnownLigand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedLigand, setSelectedLigand] = useState<{ smiles: string; name: string } | null>(null);
  const [lipinski, setLipinski] = useState<Record<string, boolean | null>>({});
  const [visMode, setVisMode] = useState<PocketVisMode>('druggability');
  const [allPockets, setAllPockets] = useState<PocketResult[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [interactionsData, setInteractionsData] = useState<InteractionsResponse | null>(null);
  const [hoveredResidue, setHoveredResidue] = useState<string | null>(null);
  const { setContext } = useAssistant();

  useEffect(() => {
    if (target) {
      document.title = `${target.gene_name || target.name} Pocket ${rankNum} — OpenDDE`;
    }
  }, [target, rankNum]);

  useEffect(() => {
    if (!target || !pocket) return;
    const approved = ligands.filter((l) => l.clinical_phase >= 4).length;
    const ic50vals = ligands.map((l) => l.activity_value_nm).filter(Boolean);
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
        const [targetData, pocketsData, ligandsData] = (await Promise.all([
          apiPost('/target/resolve', { query: params.uniprotId }),
          apiPost('/pockets', { uniprot_id: params.uniprotId }),
          apiGet(`/ligands/${params.uniprotId}`),
        ])) as [TargetInfo, PocketsResponse, LigandsResponse];

        setTarget(targetData);
        setLigands(ligandsData.ligands);
        setAllPockets(pocketsData.pockets);

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

  useEffect(() => {
    let cancelled = false;
    apiGet(`/target/${params.uniprotId}/predictions`)
      .then((data: any) => {
        if (!cancelled) {
          const completed = (data.predictions || []).filter(
            (p: Prediction) => p.status === 'complete'
          );
          setPredictions(completed);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [params.uniprotId]);

  useEffect(() => {
    if (ligands.length === 0) return;
    let cancelled = false;
    (async () => {
      const tasks = ligands.map(async (l) => {
        if (propsCache.has(l.smiles)) {
          return { id: l.chembl_id, pass: propsCache.get(l.smiles) ?? null };
        }
        try {
          const data: any = await apiGet(`/properties/${encodeURIComponent(l.smiles)}`);
          const pass = !!data.lipinski_pass;
          propsCache.set(l.smiles, pass);
          return { id: l.chembl_id, pass };
        } catch {
          propsCache.set(l.smiles, null);
          return { id: l.chembl_id, pass: null as boolean | null };
        }
      });
      const results = await Promise.all(tasks);
      if (cancelled) return;
      setLipinski(Object.fromEntries(results.map((r) => [r.id, r.pass])));
    })();
    return () => { cancelled = true; };
  }, [ligands]);

  const visModeHighlights = usePocketVisualization({
    pocket: pocket || { rank: 0, score: 0, center_x: 0, center_y: 0, center_z: 0, residues: [], residue_count: 0, druggability: 0 },
    uniprotId: params.uniprotId,
    mode: visMode,
  });

  const pocketHighlights: PocketHighlight[] = pocket ? visModeHighlights : [];

  const focusPoint = useMemo(() => {
    if (!pocket) return undefined;
    return { x: pocket.center_x, y: pocket.center_y, z: pocket.center_z };
  }, [pocket]);

  function handlePredict(lig: { smiles: string; name: string }) {
    setSelectedLigand(lig);
    setWorkflowOpen(true);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
          <p className="text-xs text-muted">Loading pocket...</p>
        </div>
      </div>
    );
  }

  if (error || !target || !pocket) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-red-400">{error || 'Pocket not found'}</p>
          <Link
            href={`/app/target/${params.uniprotId}`}
            className="text-xs text-emerald-400 hover:underline"
          >
            Back to target
          </Link>
        </div>
      </div>
    );
  }

  const structureUrl = target.structure_url ? `${API_BASE}${target.structure_url}` : null;
  const druggPct = Math.round(pocket.druggability * 100);

  const tabs = [
    { id: 'properties' as const, label: 'Properties & Profile', icon: LayoutDashboard, count: null },
    { id: 'ligands' as const, label: 'Known ligands', icon: Beaker, count: ligands.length },
    { id: 'sar' as const, label: 'SAR plot', icon: ScatterChart, count: null },
    { id: 'cliffs' as const, label: 'Activity cliffs', icon: TrendingUp, count: null },
    { id: 'ai' as const, label: 'AI suggestions', icon: Sparkles, count: null },
    { id: 'interactions' as const, label: 'Interactions', icon: Link2, count: predictions.length > 0 ? predictions.length : null },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
        <Link
          href={`/app/target/${params.uniprotId}`}
          className="flex items-center gap-1.5 text-xs text-muted-2 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{target.gene_name || target.name}</span>
        </Link>

        <div className="h-4 w-px bg-[var(--border)]" />

        <h1 className="text-sm font-semibold text-foreground">
          Pocket <span className="text-emerald-400">#{pocket.rank}</span>
        </h1>

        {/* Metrics */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-md bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted">
            Score {pocket.score.toFixed(1)}
          </span>
          <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
            pocket.druggability >= 0.7
              ? 'bg-emerald-500/10 text-emerald-400'
              : pocket.druggability >= 0.4
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
          }`}>
            {druggPct}% druggable
          </span>
          <span className="rounded-md bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted">
            {pocket.residue_count} residues
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={`${API_BASE}/api/v1/export/pockets/${params.uniprotId}`}
            download
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Export</span>
          </a>
        </div>
      </header>

      {/* ── Body: Two-row layout ──────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top section: viewer */}
        <div className="flex shrink-0 overflow-hidden" style={{ height: '55%' }}>
          {/* 3D viewer */}
          <div className="relative flex min-w-0 flex-1 flex-col bg-black">
            {/* Mode selector overlay */}
            <div className="absolute top-2 left-2 z-10 flex items-center rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm px-1">
              <PocketModeSelector mode={visMode} onChange={setVisMode} />
            </div>

            {structureUrl ? (
              <StructureViewer
                structureUrl={structureUrl}
                height="100%"
                pocketHighlights={pocketHighlights}
                focusPoint={focusPoint}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted">No structure available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom section: tabs */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--border)]">
          {/* Tab bar */}
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto bg-[var(--surface)] px-4 py-1.5 border-b border-[var(--border)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-muted-2 hover:text-foreground hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count != null && (
                    <span
                      className={`rounded-full px-1.5 text-[9px] tabular-nums ${
                        active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--surface-alt)] text-muted-2'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-[var(--bg)]">
            {activeTab === 'properties' && (
              <div className="h-full w-full overflow-y-auto p-6 bg-[var(--bg)]">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                  
                  {/* Column 1: Properties */}
                  <div className="lg:col-span-3 pb-6 flex flex-col gap-6">
                    <PocketPropertiesPanel uniprotId={params.uniprotId} rank={pocket.rank} />
                  </div>

                  {/* Column 2: Residue Map */}
                  <div className="lg:col-span-5 flex flex-col">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Sequence Map
                      </div>
                      <PocketMap
                        uniprotId={params.uniprotId}
                        rank={pocket.rank}
                        druggability={pocket.druggability}
                      />
                    </div>
                  </div>

                  {/* Column 3: Pocket Comparison */}
                  <div className="lg:col-span-4 flex flex-col">
                    {structureUrl && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-2">
                          Compare Envelopes
                        </div>
                        <PocketComparison3D
                          structureUrl={structureUrl}
                          pockets={allPockets}
                          currentRank={pocket.rank}
                        />
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            )}
            {activeTab === 'ligands' && (
              <LigandsTab
                ligands={ligands}
                lipinski={lipinski}
                onPredict={handlePredict}
              />
            )}
            {activeTab === 'sar' && (
              <div className="h-full w-full overflow-y-auto p-5">
                {ligands.length >= 2 ? (
                  <SARPlot ligands={ligands} />
                ) : (
                  <EmptyTab message="Not enough ligands for SAR analysis (need >= 2)." />
                )}
              </div>
            )}
            {activeTab === 'cliffs' && (
              <div className="h-full w-full overflow-y-auto p-5">
                {ligands.length >= 2 ? (
                  <ActivityCliffs uniprotId={params.uniprotId} />
                ) : (
                  <EmptyTab message="Not enough ligands to detect activity cliffs." />
                )}
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="h-full w-full overflow-y-auto p-5">
                {ligands.length > 0 ? (
                  <SuggestionsPanel
                    uniprotId={params.uniprotId}
                    pocket={pocket}
                    ligands={ligands}
                    onTestMolecule={(smiles, name) => handlePredict({ smiles, name })}
                  />
                ) : (
                  <EmptyTab message="No ligands available to seed AI suggestions." />
                )}
              </div>
            )}
            {activeTab === 'interactions' && (
              <div className="h-full w-full overflow-hidden">
                {predictions.length > 0 ? (
                  <BindingInteractionsTab
                    predictions={predictions}
                    interactionsData={interactionsData}
                    onInteractionsLoaded={setInteractionsData}
                    hoveredResidue={hoveredResidue}
                    onHoverResidue={setHoveredResidue}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-5">
                    <Link2 className="h-8 w-8 text-muted-2" />
                    <p className="text-xs text-muted-2">No complex predictions yet.</p>
                    <p className="text-xs text-muted-2">
                      Predict a ligand-protein complex first using the Known Ligands tab.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prediction workflow modal */}
      <PredictionWorkflow
        isOpen={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        targetInfo={target}
        ligand={selectedLigand}
        pocket={pocket}
        onComplete={() => window.location.reload()}
      />
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────── */
function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-xs text-muted-2">{message}</p>
    </div>
  );
}

/* ── Ligands tab ─────────────────────────────────────── */
function LigandsTab({
  ligands,
  lipinski,
  onPredict,
}: {
  ligands: KnownLigand[];
  lipinski: Record<string, boolean | null>;
  onPredict: (lig: { smiles: string; name: string }) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('activity_value_nm');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'clinical' | 'lipinski'>('all');
  const [customOpen, setCustomOpen] = useState(false);
  const [customSmiles, setCustomSmiles] = useState('');
  const [customName, setCustomName] = useState('');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = useMemo(() => {
    let out = ligands;
    if (filter === 'approved') out = out.filter((l) => l.clinical_phase >= 4);
    else if (filter === 'clinical') out = out.filter((l) => l.clinical_phase >= 1);
    else if (filter === 'lipinski') out = out.filter((l) => lipinski[l.chembl_id] === true);
    const mul = sortAsc ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
      if (sortKey === 'clinical_phase') return mul * (a.clinical_phase - b.clinical_phase);
      return mul * (a.activity_value_nm - b.activity_value_nm);
    });
  }, [ligands, lipinski, filter, sortKey, sortAsc]);

  const sortArrow = (key: SortKey) => (sortKey !== key ? '' : sortAsc ? ' \u2191' : ' \u2193');

  function submitCustom() {
    if (!customSmiles.trim()) return;
    onPredict({ smiles: customSmiles.trim(), name: customName.trim() || 'Custom compound' });
    setCustomOpen(false);
    setCustomSmiles('');
    setCustomName('');
  }

  if (ligands.length === 0) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4">
          <span className="text-[11px] text-muted-2">No known ligands for this target</span>
          <button
            onClick={() => setCustomOpen(!customOpen)}
            className="flex h-7 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Pencil className="h-3 w-3 text-emerald-400" />
            Test custom SMILES
          </button>
        </div>
        {customOpen && (
          <CustomRow
            customName={customName} setCustomName={setCustomName}
            customSmiles={customSmiles} setCustomSmiles={setCustomSmiles}
            onSubmit={submitCustom} onCancel={() => setCustomOpen(false)}
          />
        )}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-2">Add a SMILES above to predict a complex.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Controls */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4">
        <span className="text-[11px] text-muted-2 tabular-nums">
          <span className="font-semibold text-foreground">{filtered.length}</span>
          {filtered.length !== ligands.length && <span> of {ligands.length}</span>} ligands
        </span>

        <div className="flex items-center gap-1.5">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-7 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[10px] text-foreground"
            aria-label="Sort by"
          >
            <option value="activity_value_nm">Sort: Activity</option>
            <option value="name">Sort: Name</option>
            <option value="clinical_phase">Sort: Phase</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[10px] text-foreground hover:bg-[var(--surface-hover)]"
            aria-label="Toggle sort direction"
          >
            {sortAsc ? '\u2191' : '\u2193'}
          </button>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-7 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[10px] text-foreground"
          aria-label="Filter ligands"
        >
          <option value="all">Filter: All</option>
          <option value="approved">Approved only</option>
          <option value="clinical">Clinical (phase {'\u2265'} 1)</option>
          <option value="lipinski">Lipinski pass</option>
        </select>

        <button
          onClick={() => setCustomOpen(!customOpen)}
          className="ml-auto flex h-7 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Pencil className="h-3 w-3 text-emerald-400" />
          Test custom SMILES
        </button>
      </div>

      {customOpen && (
        <CustomRow
          customName={customName} setCustomName={setCustomName}
          customSmiles={customSmiles} setCustomSmiles={setCustomSmiles}
          onSubmit={submitCustom} onCancel={() => setCustomOpen(false)}
        />
      )}

      {/* Table header */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-2">
        <div className="w-10 shrink-0">2D</div>
        <button onClick={() => toggleSort('name')} className="flex-1 min-w-[140px] text-left hover:text-foreground">
          Name{sortArrow('name')}
        </button>
        <div className="w-12 shrink-0">Type</div>
        <button onClick={() => toggleSort('activity_value_nm')} className="w-20 shrink-0 text-right hover:text-foreground">
          Activity{sortArrow('activity_value_nm')}
        </button>
        <button onClick={() => toggleSort('clinical_phase')} className="w-14 shrink-0 text-center hover:text-foreground">
          Phase{sortArrow('clinical_phase')}
        </button>
        <div className="w-10 shrink-0 text-center">Lip.</div>
        <div className="w-16 shrink-0 text-right">Action</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((lig) => (
            <LigandRow
              key={lig.chembl_id}
              lig={lig}
              lipinskiPass={lipinski[lig.chembl_id]}
              onPredict={() => onPredict({ smiles: lig.smiles, name: lig.name })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LigandRow({
  lig,
  lipinskiPass,
  onPredict,
}: {
  lig: KnownLigand;
  lipinskiPass: boolean | null | undefined;
  onPredict: () => void;
}) {
  return (
    <div className="flex h-12 items-center gap-2 px-4 transition-colors hover:bg-[var(--surface-hover)]">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white">
        {lig.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lig.image_url} alt={lig.name} width={40} height={40} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="h-full w-full bg-[var(--surface-alt)]" />
        )}
      </div>

      <div className="min-w-[140px] flex-1 overflow-hidden">
        <div className="truncate text-[12px] font-medium text-foreground">{lig.name}</div>
        <div className="truncate text-[10px] text-muted-2 font-mono">{lig.chembl_id}</div>
      </div>

      <div className={`w-12 shrink-0 text-[10px] font-semibold uppercase ${activityTypeColor(lig.activity_type)}`}>
        {lig.activity_type}
      </div>

      <div className="w-20 shrink-0 text-right text-[11px] tabular-nums text-foreground">
        {formatActivity(lig.activity_value_nm)}
      </div>

      <div className="flex w-14 shrink-0 items-center justify-center gap-1.5" title={lig.clinical_phase_label}>
        <span className={`h-2 w-2 rounded-full ${phaseDotColor(lig.clinical_phase)}`} />
        <span className="text-[10px] tabular-nums text-muted">
          {lig.clinical_phase > 0 ? lig.clinical_phase : '\u2014'}
        </span>
      </div>

      <div className="flex w-10 shrink-0 items-center justify-center">
        {lipinskiPass === undefined ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-2" />
        ) : lipinskiPass === true ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : lipinskiPass === false ? (
          <XIcon className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <span className="text-[10px] text-muted-2">{'\u2014'}</span>
        )}
      </div>

      <div className="w-16 shrink-0 text-right">
        <button
          onClick={onPredict}
          className="h-7 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Predict
        </button>
      </div>
    </div>
  );
}

function CustomRow({
  customName, setCustomName, customSmiles, setCustomSmiles, onSubmit, onCancel,
}: {
  customName: string; setCustomName: (s: string) => void;
  customSmiles: string; setCustomSmiles: (s: string) => void;
  onSubmit: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-emerald-500/5 px-4">
      <Pencil className="h-3 w-3 shrink-0 text-emerald-400" />
      <input
        type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
        placeholder="Name (optional)"
        className="h-8 w-36 shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-foreground placeholder:text-muted-2"
      />
      <input
        type="text" value={customSmiles} onChange={(e) => setCustomSmiles(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()} placeholder="Enter SMILES string..."
        className="h-8 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 font-mono text-[11px] text-foreground placeholder:text-muted-2"
      />
      <button
        onClick={onSubmit} disabled={!customSmiles.trim()}
        className="h-8 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
      >
        Predict
      </button>
      <button onClick={onCancel} className="h-8 w-8 rounded-md border border-[var(--border)] bg-[var(--bg)] text-muted-2 hover:text-foreground" aria-label="Cancel">
        {'\u00D7'}
      </button>
    </div>
  );
}

/* ── Binding interactions tab ────────────────────────── */
function BindingInteractionsTab({
  predictions, interactionsData, onInteractionsLoaded, hoveredResidue, onHoverResidue,
}: {
  predictions: Prediction[];
  interactionsData: InteractionsResponse | null;
  onInteractionsLoaded: (data: InteractionsResponse) => void;
  hoveredResidue: string | null;
  onHoverResidue: (r: string | null) => void;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction>(predictions[0]);

  return (
    <div className="flex h-full flex-col">
      {predictions.length > 1 && (
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
            Complex
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {predictions.map((p) => (
              <button
                key={p.prediction_id}
                onClick={() => setSelectedPrediction(p)}
                className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  selectedPrediction.prediction_id === p.prediction_id
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--border)] text-muted hover:text-foreground'
                }`}
              >
                {p.ligand_name || p.ligand_ccd || 'Complex'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex-[3] overflow-y-auto border-r border-[var(--border)] p-4">
          <InteractionView
            predictionId={selectedPrediction.prediction_id}
            onInteractionsLoaded={onInteractionsLoaded}
            hoveredResidue={hoveredResidue}
            onHoverResidue={onHoverResidue}
          />
        </div>
        <div className="flex-[2] overflow-hidden p-4">
          {interactionsData && selectedPrediction.ligand_smiles ? (
            <InteractionDiagram2D
              ligandSmiles={selectedPrediction.ligand_smiles}
              interactions={interactionsData}
              hoveredResidue={hoveredResidue}
              onHoverResidue={onHoverResidue}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-muted-2">
                {!selectedPrediction.ligand_smiles
                  ? 'No SMILES available for 2D diagram'
                  : 'Loading interaction data...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
