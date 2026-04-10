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
} from 'lucide-react';
import type { PocketHighlight } from '@/components/StructureViewer';
import PocketMap from '@/components/PocketMap';
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
} from '@/lib/types';

const StructureViewer = dynamic(() => import('@/components/StructureViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />,
});

const SARPlot = dynamic(() => import('@/components/SARPlot'), {
  loading: () => <div className="shimmer h-full w-full rounded" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Helpers ──────────────────────────────────────────── */
const propsCache = new Map<string, boolean | null>();

function formatActivity(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mM`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} μM`;
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
    case 'IC50':
      return 'text-blue-400';
    case 'Ki':
      return 'text-purple-400';
    case 'Kd':
      return 'text-amber-400';
    default:
      return 'text-muted-2';
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

const HYDROPHOBIC = new Set(['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO']);
const POLAR = new Set(['SER', 'THR', 'CYS', 'ASN', 'GLN', 'TYR', 'GLY']);
const POS = new Set(['LYS', 'ARG', 'HIS']);
const NEG = new Set(['ASP', 'GLU']);

function residueComposition(residues: string[]) {
  let h = 0;
  let p = 0;
  let c = 0;
  for (const r of residues) {
    const aa = r.slice(0, 3).toUpperCase();
    if (HYDROPHOBIC.has(aa)) h++;
    else if (POLAR.has(aa)) p++;
    else if (POS.has(aa) || NEG.has(aa)) c++;
    else p++;
  }
  const total = h + p + c || 1;
  return {
    hydrophobic: Math.round((100 * h) / total),
    polar: Math.round((100 * p) / total),
    charged: Math.round((100 * c) / total),
  };
}

/* ── Types ────────────────────────────────────────────── */
type Tab = 'ligands' | 'sar' | 'cliffs' | 'ai';
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

  const [activeTab, setActiveTab] = useState<Tab>('ligands');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedLigand, setSelectedLigand] = useState<{ smiles: string; name: string } | null>(null);
  const [lipinski, setLipinski] = useState<Record<string, boolean | null>>({});
  const { setContext } = useAssistant();

  // Page title
  useEffect(() => {
    if (target) {
      document.title = `${target.gene_name || target.name} Pocket ${rankNum} — OpenDDE`;
    }
  }, [target, rankNum]);

  // Assistant context
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

  // Fetch target + pockets + ligands
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

  // Fetch Lipinski for each ligand (parallel, cached)
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
    return () => {
      cancelled = true;
    };
  }, [ligands]);

  const pocketHighlights: PocketHighlight[] = useMemo(() => {
    if (!pocket) return [];
    return [{ rank: pocket.rank, residues: pocket.residues, selected: true }];
  }, [pocket]);

  const focusPoint = useMemo(() => {
    if (!pocket) return undefined;
    return { x: pocket.center_x, y: pocket.center_y, z: pocket.center_z };
  }, [pocket]);

  const composition = useMemo(
    () => (pocket ? residueComposition(pocket.residues) : { hydrophobic: 0, polar: 0, charged: 0 }),
    [pocket],
  );

  function handlePredict(lig: { smiles: string; name: string }) {
    setSelectedLigand(lig);
    setWorkflowOpen(true);
  }

  /* ── Loading / error states ─────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
          <p className="text-xs text-muted">Loading pocket…</p>
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
            ← Back to target
          </Link>
        </div>
      </div>
    );
  }

  const structureUrl = target.structure_url ? `${API_BASE}${target.structure_url}` : null;
  const druggPct = Math.round(pocket.druggability * 100);

  const tabs = [
    { id: 'ligands' as const, label: 'Known ligands', icon: Beaker, count: ligands.length },
    { id: 'sar' as const, label: 'SAR plot', icon: ScatterChart, count: null },
    { id: 'cliffs' as const, label: 'Activity cliffs', icon: TrendingUp, count: null },
    { id: 'ai' as const, label: 'AI suggestions', icon: Sparkles, count: null },
  ];

  /* ── Layout ─────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col">
      {/* ── Compact header (36px) ─────────────────── */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
        <Link
          href={`/app/target/${params.uniprotId}`}
          className="flex items-center gap-1 text-[11px] text-muted-2 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {target.gene_name || target.name}
        </Link>
        <div className="h-3 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold text-foreground">
          Pocket <span className="text-emerald-400">#{pocket.rank}</span>
        </h1>
        <span className="text-[11px] text-muted-2 tabular-nums hidden sm:inline">
          Score <span className="text-muted">{pocket.score.toFixed(1)}</span>
        </span>
        <span className={`text-[11px] tabular-nums hidden sm:inline ${druggabilityText(pocket.druggability)}`}>
          Druggability <span className="font-semibold">{druggPct}%</span>
        </span>
        <span className="text-[11px] text-muted-2 tabular-nums hidden md:inline">
          <span className="text-muted">{pocket.residue_count}</span> residues
        </span>
        <a
          href={`${API_BASE}/api/v1/export/pockets/${params.uniprotId}`}
          download
          className="ml-auto flex h-6 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[10px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Download className="h-3 w-3 text-purple-400" />
          Export
        </a>
      </header>

      {/* ── Top split: viewer 60% / details 40% ──── */}
      <div className="flex min-h-0 flex-1 basis-1/2 border-b border-[var(--border)]">
        {/* 3D viewer */}
        <div className="relative min-w-0 flex-[3] bg-black">
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

        {/* Pocket details */}
        <aside className="flex flex-[2] min-w-[280px] flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)]">
          <div className="flex h-8 shrink-0 items-center border-b border-[var(--border)] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
              Pocket details
            </span>
          </div>

          <div className="space-y-4 p-3">
            {/* Composition bars */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Composition
              </div>
              <div className="space-y-1.5">
                <CompositionBar
                  label="Hydrophobic"
                  pct={composition.hydrophobic}
                  color="bg-amber-500"
                />
                <CompositionBar label="Polar" pct={composition.polar} color="bg-blue-500" />
                <CompositionBar label="Charged" pct={composition.charged} color="bg-purple-500" />
              </div>
            </div>

            {/* Key stats grid */}
            <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
              <Stat label="Score" value={pocket.score.toFixed(1)} />
              <Stat
                label="Druggability"
                value={`${druggPct}%`}
                valueClass={druggabilityText(pocket.druggability)}
              />
              <Stat label="Residues" value={`${pocket.residue_count}`} />
            </div>

            {/* Radial residue map */}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Residue map
              </div>
              <PocketMap
                uniprotId={params.uniprotId}
                rank={pocket.rank}
                druggability={pocket.druggability}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* ── Tab bar (36px) ─────────────────────────── */}
      <div className="flex h-9 shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                active
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-muted-2 hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
              {tab.count != null && (
                <span
                  className={`ml-0.5 rounded px-1 text-[9px] tabular-nums ${
                    active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--surface-alt)] text-muted-2'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ────────────────────────────── */}
      <div className="flex min-h-0 flex-1 basis-1/2 overflow-hidden bg-[var(--bg)]">
        {activeTab === 'ligands' && (
          <LigandsTab
            ligands={ligands}
            lipinski={lipinski}
            onPredict={handlePredict}
          />
        )}
        {activeTab === 'sar' && (
          <div className="h-full w-full overflow-y-auto p-4">
            {ligands.length >= 2 ? (
              <SARPlot ligands={ligands} />
            ) : (
              <EmptyTab message="Not enough ligands for SAR analysis (need ≥ 2)." />
            )}
          </div>
        )}
        {activeTab === 'cliffs' && (
          <div className="h-full w-full overflow-y-auto p-4">
            {ligands.length >= 2 ? (
              <ActivityCliffs uniprotId={params.uniprotId} />
            ) : (
              <EmptyTab message="Not enough ligands to detect activity cliffs." />
            )}
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="h-full w-full overflow-y-auto p-4">
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
      </div>

      {/* Prediction workflow modal */}
      <PredictionWorkflow
        isOpen={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        targetInfo={target}
        ligand={selectedLigand}
      />
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────── */
function CompositionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-2">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${valueClass || 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-xs text-muted-2">{message}</p>
    </div>
  );
}

/* ── Ligands tab (compact table) ─────────────────────── */
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
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
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

  const sortArrow = (key: SortKey) => (sortKey !== key ? '' : sortAsc ? ' ↑' : ' ↓');

  function submitCustom() {
    if (!customSmiles.trim()) return;
    onPredict({
      smiles: customSmiles.trim(),
      name: customName.trim() || 'Custom compound',
    });
    setCustomOpen(false);
    setCustomSmiles('');
    setCustomName('');
  }

  if (ligands.length === 0) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3">
          <span className="text-[11px] text-muted-2">No known ligands for this target</span>
          <button
            onClick={() => setCustomOpen(!customOpen)}
            className="flex h-7 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Pencil className="h-3 w-3 text-emerald-400" />
            Test custom SMILES
          </button>
        </div>
        {customOpen && (
          <CustomRow
            customName={customName}
            setCustomName={setCustomName}
            customSmiles={customSmiles}
            setCustomSmiles={setCustomSmiles}
            onSubmit={submitCustom}
            onCancel={() => setCustomOpen(false)}
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
      {/* Table controls */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3">
        <span className="text-[11px] text-muted-2 tabular-nums">
          <span className="font-semibold text-foreground">{filtered.length}</span>
          {filtered.length !== ligands.length && (
            <span> of {ligands.length}</span>
          )}{' '}
          ligands
        </span>

        <div className="flex items-center gap-1">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-6 rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 text-[10px] text-foreground"
            aria-label="Sort by"
          >
            <option value="activity_value_nm">Sort: Activity</option>
            <option value="name">Sort: Name</option>
            <option value="clinical_phase">Sort: Phase</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="h-6 w-6 rounded border border-[var(--border)] bg-[var(--bg)] text-[10px] text-foreground hover:bg-[var(--surface-hover)]"
            aria-label="Toggle sort direction"
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-6 rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 text-[10px] text-foreground"
          aria-label="Filter ligands"
        >
          <option value="all">Filter: All</option>
          <option value="approved">Approved only</option>
          <option value="clinical">Clinical (phase ≥ 1)</option>
          <option value="lipinski">Lipinski pass</option>
        </select>

        <button
          onClick={() => setCustomOpen(!customOpen)}
          className="ml-auto flex h-7 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Pencil className="h-3 w-3 text-emerald-400" />
          Test custom SMILES
        </button>
      </div>

      {/* Custom SMILES inline row */}
      {customOpen && (
        <CustomRow
          customName={customName}
          setCustomName={setCustomName}
          customSmiles={customSmiles}
          setCustomSmiles={setCustomSmiles}
          onSubmit={submitCustom}
          onCancel={() => setCustomOpen(false)}
        />
      )}

      {/* Table header */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-2">
        <div className="w-10 shrink-0">2D</div>
        <button
          onClick={() => toggleSort('name')}
          className="flex-1 min-w-[140px] text-left hover:text-foreground"
        >
          Name{sortArrow('name')}
        </button>
        <div className="w-12 shrink-0">Type</div>
        <button
          onClick={() => toggleSort('activity_value_nm')}
          className="w-20 shrink-0 text-right hover:text-foreground"
        >
          Activity{sortArrow('activity_value_nm')}
        </button>
        <button
          onClick={() => toggleSort('clinical_phase')}
          className="w-14 shrink-0 text-center hover:text-foreground"
        >
          Phase{sortArrow('clinical_phase')}
        </button>
        <div className="w-10 shrink-0 text-center">Lip.</div>
        <div className="w-16 shrink-0 text-right">Action</div>
      </div>

      {/* Rows (scrollable) */}
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
    <div className="flex h-11 items-center gap-2 px-3 transition-colors hover:bg-[var(--surface-hover)]">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white">
        {lig.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lig.image_url}
            alt={lig.name}
            width={40}
            height={40}
            loading="lazy"
            className="h-full w-full object-contain"
          />
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
          {lig.clinical_phase > 0 ? lig.clinical_phase : '—'}
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
          <span className="text-[10px] text-muted-2">—</span>
        )}
      </div>

      <div className="w-16 shrink-0 text-right">
        <button
          onClick={onPredict}
          className="h-6 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Predict
        </button>
      </div>
    </div>
  );
}

function CustomRow({
  customName,
  setCustomName,
  customSmiles,
  setCustomSmiles,
  onSubmit,
  onCancel,
}: {
  customName: string;
  setCustomName: (s: string) => void;
  customSmiles: string;
  setCustomSmiles: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-emerald-500/5 px-3">
      <Pencil className="h-3 w-3 shrink-0 text-emerald-400" />
      <input
        type="text"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="Name (optional)"
        className="h-7 w-32 shrink-0 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-foreground placeholder:text-muted-2"
      />
      <input
        type="text"
        value={customSmiles}
        onChange={(e) => setCustomSmiles(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="Enter SMILES string…"
        className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 font-mono text-[11px] text-foreground placeholder:text-muted-2"
      />
      <button
        onClick={onSubmit}
        disabled={!customSmiles.trim()}
        className="h-7 rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
      >
        Predict
      </button>
      <button
        onClick={onCancel}
        className="h-7 w-7 rounded border border-[var(--border)] bg-[var(--bg)] text-[11px] text-muted-2 hover:text-foreground"
        aria-label="Cancel"
      >
        ×
      </button>
    </div>
  );
}
