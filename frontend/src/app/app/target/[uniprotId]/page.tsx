'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  FileText,
  BarChart3,
  Sparkles,
  Download,
  Loader2,
  ArrowRight,
  Shield,
  Info,
  GitBranch,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { PocketHighlight } from '@/components/MolstarViewer';
import { StructureViewerSkeleton } from '@/components/Skeletons';
import { useAssistant } from '@/components/AssistantContext';
import { apiPost, apiGet } from '@/lib/api';
import type { TargetInfo, PocketResult, PocketsResponse } from '@/lib/types';

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <StructureViewerSkeleton />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Types ────────────────────────────────────────────── */
interface SafetyData {
  ensembl_id: string;
  symbol: string;
  tractability: Record<string, string>;
  safety_liabilities: { event: string; direction: string | null; tissue: string | null }[];
  known_drugs_count: number;
  top_disease_associations: { disease: string; score: number }[];
}

interface SimilarTarget {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
  length: number;
  in_opendde?: boolean;
}

/* ── Helpers ──────────────────────────────────────────── */
function druggabilityColor(d: number): string {
  if (d >= 0.7) return 'bg-emerald-500';
  if (d >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}
function druggabilityText(d: number): string {
  if (d >= 0.7) return 'text-emerald-400';
  if (d >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}
function druggabilityBadge(d: number): string {
  if (d >= 0.7) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (d >= 0.4) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

/* ── Pocket card ─────────────────────────────────────── */
function PocketCard({
  pocket,
  selected,
  onSelect,
  uniprotId,
}: {
  pocket: PocketResult;
  selected: boolean;
  onSelect: () => void;
  uniprotId: string;
}) {
  const pct = Math.round(pocket.druggability * 100);
  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-lg border p-3 transition-all ${
        selected
          ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
            selected ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-alt)] text-foreground'
          }`}
        >
          {pocket.rank}
        </span>
        <span className={`text-sm font-bold tabular-nums ${druggabilityText(pocket.druggability)}`}>
          {pct}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)] mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${druggabilityColor(pocket.druggability)}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-2">
          Score <span className="tabular-nums text-muted">{pocket.score.toFixed(1)}</span>
        </span>
        <span className="text-muted-2">
          <span className="tabular-nums text-muted">{pocket.residue_count}</span> res
        </span>
      </div>

      <Link
        href={`/app/target/${uniprotId}/pocket/${pocket.rank}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 flex items-center justify-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] py-1 text-[10px] font-medium text-muted-2 opacity-0 transition-all group-hover:opacity-100 hover:text-emerald-400 hover:border-emerald-500/30"
      >
        View details <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ── Info panel tabs ─────────────────────────────────── */
type Tab = 'summary' | 'safety' | 'similar' | 'ai';

function SummaryTab({ target, pockets }: { target: TargetInfo; pockets: PocketResult[] }) {
  const best = pockets[0];
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
            Identifier
          </div>
          <div className="font-mono text-xs text-foreground">{target.uniprot_id}</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
            Organism
          </div>
          <div className="text-xs italic text-foreground">{target.organism}</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
            Length
          </div>
          <div className="text-xs tabular-nums text-foreground">{target.length} aa</div>
        </div>
        {target.plddt_mean != null && (
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
              pLDDT
            </div>
            <div className="text-xs tabular-nums text-foreground">
              {target.plddt_mean.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Structure source
        </div>
        <div className="text-xs text-foreground">
          {target.structure_source === 'alphafold_db' ? 'AlphaFold DB' : target.structure_source || '—'}
        </div>
      </div>
      {best && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
              Top pocket
            </span>
            <span className="text-[10px] text-muted-2">#{best.rank}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-bold tabular-nums ${druggabilityText(best.druggability)}`}>
              {Math.round(best.druggability * 100)}%
            </span>
            <span className="text-[10px] text-muted-2">druggability</span>
          </div>
        </div>
      )}
      <a
        href={`https://www.uniprot.org/uniprotkb/${target.uniprot_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        View on UniProt
      </a>
    </div>
  );
}

function SafetyTab({ uniprotId }: { uniprotId: string }) {
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/target/${uniprotId}/safety`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uniprotId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-2" />
      </div>
    );
  }
  if (!data) {
    return <div className="p-4 text-xs text-muted-2">No safety data available.</div>;
  }

  const tractKeys = Object.keys(data.tractability);
  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Tractability
        </div>
        {tractKeys.length > 0 ? (
          <div className="space-y-1.5">
            {tractKeys.map((mod) => (
              <div key={mod} className="flex items-center justify-between text-[11px]">
                <span className="text-muted">
                  {mod === 'small_molecule' ? 'Small molecule' : mod === 'antibody' ? 'Antibody' : mod}
                </span>
                <span className="rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] font-medium text-foreground">
                  {data.tractability[mod]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-2">No tractability data</div>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted">Known drugs</span>
        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 tabular-nums">
          {data.known_drugs_count}
        </span>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Safety signals
        </div>
        {data.safety_liabilities.length > 0 ? (
          <div className="space-y-1.5">
            {data.safety_liabilities.slice(0, 6).map((sl, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-foreground">{sl.event}</span>
              </div>
            ))}
            {data.safety_liabilities.length > 6 && (
              <div className="text-[10px] text-muted-2">
                +{data.safety_liabilities.length - 6} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-emerald-400">No known liabilities</div>
        )}
      </div>
    </div>
  );
}

function SimilarTab({ uniprotId }: { uniprotId: string }) {
  const [targets, setTargets] = useState<SimilarTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/target/${uniprotId}/similar?limit=8`)
      .then((d) => setTargets(d.similar_targets || []))
      .catch(() => setTargets([]))
      .finally(() => setLoading(false));
  }, [uniprotId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-2" />
      </div>
    );
  }
  if (targets.length === 0) {
    return <div className="p-4 text-xs text-muted-2">No similar targets found.</div>;
  }
  return (
    <div className="divide-y divide-[var(--border)]">
      {targets.map((t) => (
        <Link
          key={t.uniprot_id}
          href={`/app/target/${t.uniprot_id}`}
          className="flex items-center justify-between gap-2 px-4 py-2.5 text-[11px] transition-colors hover:bg-[var(--surface-hover)]"
        >
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {t.gene_name || t.uniprot_id}
            </div>
            <div className="text-[10px] text-muted-2 truncate">{t.name}</div>
          </div>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-2" />
        </Link>
      ))}
    </div>
  );
}

function AITab({
  target,
  pockets,
  onAskAI,
}: {
  target: TargetInfo;
  pockets: PocketResult[];
  onAskAI: () => void;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pockets.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/v1/assistant/pocket-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uniprot_id: target.uniprot_id,
            target_name: target.name,
            pockets: pockets.map((p) => ({
              rank: p.rank,
              score: p.score,
              druggability: p.druggability,
              residue_count: p.residue_count,
            })),
            ligand_count: 0,
          }),
        });
        if (!resp.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const data = await resp.json();
        if (!cancelled) setSummary(data.summary);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target, pockets]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            AI pocket analysis
          </span>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="shimmer h-3 w-full rounded" />
            <div className="shimmer h-3 w-5/6 rounded" />
            <div className="shimmer h-3 w-4/6 rounded" />
          </div>
        ) : error || !summary ? (
          <div className="text-[11px] text-muted-2">AI analysis unavailable.</div>
        ) : (
          <p className="text-[12px] leading-relaxed text-foreground">{summary}</p>
        )}
      </div>
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        <button
          onClick={onAskAI}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500/10 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          Ask AI assistant
        </button>
      </div>
    </div>
  );
}

/* ── Main target page ────────────────────────────────── */
export default function TargetPage() {
  const params = useParams<{ uniprotId: string }>();
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pockets, setPockets] = useState<PocketResult[]>([]);
  const [pocketsLoading, setPocketsLoading] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState<number | null>(null);
  const [hasPredictions, setHasPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { setContext, toggleDrawer } = useAssistant();

  useEffect(() => {
    if (target) {
      document.title = `${target.gene_name || target.name} — OpenDDE`;
    }
  }, [target]);

  useEffect(() => {
    if (!target) return;
    setContext({
      page: 'target',
      target: {
        name: target.name,
        uniprot_id: target.uniprot_id,
        organism: target.organism,
        length: target.length,
        gene_name: target.gene_name,
        plddt_mean: target.plddt_mean,
      },
      pockets: pockets.map((p) => ({
        rank: p.rank,
        score: p.score,
        druggability: p.druggability,
        residue_count: p.residue_count,
      })),
    });
  }, [target, pockets, setContext]);

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

  useEffect(() => {
    if (!target?.uniprot_id) return;
    async function fetchPockets() {
      setPocketsLoading(true);
      try {
        const data: PocketsResponse = await apiPost('/pockets', {
          uniprot_id: target!.uniprot_id,
        });
        setPockets(data.pockets);
        if (data.pockets.length > 0) setSelectedPocket(data.pockets[0].rank);
      } catch {
        /* optional */
      } finally {
        setPocketsLoading(false);
      }
    }
    fetchPockets();

    apiGet(`/target/${target!.uniprot_id}/predictions`)
      .then((data: any) => {
        if (data.predictions?.length > 0) setHasPredictions(true);
      })
      .catch(() => {});
  }, [target?.uniprot_id]);

  const pocketHighlights: PocketHighlight[] = useMemo(
    () =>
      pockets.map((p) => ({
        rank: p.rank,
        residues: p.residues,
        selected: selectedPocket === p.rank,
      })),
    [pockets, selectedPocket],
  );

  const focusPoint = useMemo(() => {
    if (selectedPocket == null) return undefined;
    const p = pockets.find((x) => x.rank === selectedPocket);
    if (!p) return undefined;
    return { x: p.center_x, y: p.center_y, z: p.center_z };
  }, [pockets, selectedPocket]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
          <p className="text-xs text-muted">Resolving target...</p>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-red-400">{error || 'Target not found'}</p>
          <Link href="/app/dashboard" className="text-xs text-emerald-400 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const structureUrl = target.structure_url ? `${API_BASE}${target.structure_url}` : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground truncate">
            {target.gene_name && (
              <span className="text-emerald-400">{target.gene_name}</span>
            )}
            {target.gene_name && ' — '}
            {target.name}
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] italic text-muted-2">{target.organism}</span>
            <span className="text-[11px] text-muted-2 tabular-nums">{target.length} aa</span>
            {target.structure_source && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  target.structure_source === 'alphafold_db'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-purple-500/10 text-purple-400'
                }`}
              >
                {target.structure_source === 'alphafold_db' ? 'AlphaFold' : 'PDB'}
              </span>
            )}
            {target.plddt_mean != null && (
              <span className="text-[11px] text-muted-2">
                pLDDT <span className="tabular-nums text-muted">{target.plddt_mean.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/target/${target.uniprot_id}/report`}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Report</span>
          </Link>
          <button
            onClick={toggleDrawer}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
          <a
            href={`${API_BASE}/api/v1/target/${target.uniprot_id}/report?format=json`}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Export</span>
          </a>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: viewer + pockets */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* 3D Viewer */}
          <div className="relative shrink-0 bg-black" style={{ height: '55vh', minHeight: 360 }}>
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
            {/* Floating pocket count badge */}
            <div className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm px-3 py-1.5">
              <span className="text-[10px] text-white/60">
                <span className="text-sm font-bold text-white tabular-nums">{pockets.length}</span> pockets detected
              </span>
            </div>
          </div>

          {/* Pockets grid */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Binding Pockets</h2>
              <span className="text-[10px] text-muted-2">Click to highlight in 3D</span>
            </div>
            {pocketsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
              </div>
            ) : pockets.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-muted-2">No pockets detected</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {pockets.map((p) => (
                  <PocketCard
                    key={p.rank}
                    pocket={p}
                    selected={selectedPocket === p.rank}
                    onSelect={() => setSelectedPocket(p.rank)}
                    uniprotId={target.uniprot_id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: info panel */}
        <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
          <div className="flex shrink-0 border-b border-[var(--border)]">
            {([
              { id: 'summary', label: 'Summary', icon: Info },
              { id: 'safety', label: 'Safety', icon: Shield },
              { id: 'similar', label: 'Similar', icon: GitBranch },
              { id: 'ai', label: 'AI', icon: Sparkles },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 border-b-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-muted-2 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'summary' && <SummaryTab target={target} pockets={pockets} />}
            {activeTab === 'safety' && <SafetyTab uniprotId={target.uniprot_id} />}
            {activeTab === 'similar' && <SimilarTab uniprotId={target.uniprot_id} />}
            {activeTab === 'ai' && (
              <AITab target={target} pockets={pockets} onAskAI={toggleDrawer} />
            )}
          </div>
          {/* Quick links */}
          <div className="shrink-0 border-t border-[var(--border)] p-3 space-y-1.5">
            {hasPredictions && (
              <Link
                href={`/app/target/${target.uniprot_id}/compare`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted hover:bg-[var(--surface-hover)] hover:text-foreground transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                Compare ligands
              </Link>
            )}
            <a
              href={`https://www.uniprot.org/uniprotkb/${target.uniprot_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted hover:bg-[var(--surface-hover)] hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              UniProt entry
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
