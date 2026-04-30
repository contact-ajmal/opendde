'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { apiPost } from '@/lib/api';
import { getCampaign, pollCampaign } from '@/lib/affinity';
import { formatNm } from '@/lib/screen-utils';
import type {
  AffinityPrediction,
  CampaignStatusResponse,
  TargetInfo,
} from '@/lib/types';

const PredictionWorkflow = dynamic(() => import('@/components/PredictionWorkflow'), {
  ssr: false,
});

type SortKey = 'rank' | 'name' | 'pic50' | 'ic50_nm' | 'binder' | 'status';

interface BatchProperties {
  smiles: string;
  lipinski_pass?: boolean;
  error?: string;
}

export default function ScreenResultsPage() {
  const params = useParams<{ campaignId: string }>();

  const [data, setData] = useState<CampaignStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [lipinski, setLipinski] = useState<Record<string, boolean | undefined>>({});
  const [predictTarget, setPredictTarget] = useState<AffinityPrediction | null>(null);

  // Filters / sort
  const [search, setSearch] = useState('');
  const [minPic50, setMinPic50] = useState(0);
  const [minBinder, setMinBinder] = useState(0);
  const [lipinskiOnly, setLipinskiOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'failed' | 'running'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('pic50');
  const [sortAsc, setSortAsc] = useState(false);

  /* ── Fetch + poll campaign ──────────────────────────── */
  useEffect(() => {
    let cancel: (() => void) | null = null;
    getCampaign(params.campaignId)
      .then((r) => {
        setData(r);
        if (!r.campaign.completed_at) {
          cancel = pollCampaign(params.campaignId, setData);
        }
      })
      .catch((e) => setError((e as Error).message));
    return () => { cancel?.(); };
  }, [params.campaignId]);

  /* ── Resolve target details for display ─────────────── */
  useEffect(() => {
    if (!data?.campaign.uniprot_id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/targets/${data.campaign.uniprot_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => t && setTarget(t))
      .catch(() => { /* non-critical */ });
  }, [data?.campaign.uniprot_id]);

  /* ── Lipinski (one batch call when results land) ────── */
  useEffect(() => {
    if (!data) return;
    const smilesNeeded = data.predictions
      .filter((p) => p.status === 'complete')
      .map((p) => p.ligand_smiles)
      .filter((s) => lipinski[s] === undefined);
    if (smilesNeeded.length === 0) return;
    apiPost('/properties/batch', { smiles_list: smilesNeeded })
      .then((rows: BatchProperties[]) => {
        setLipinski((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            next[r.smiles] = r.error ? undefined : !!r.lipinski_pass;
          }
          return next;
        });
      })
      .catch(() => { /* non-critical */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.predictions.length]);

  /* ── Filtered + sorted rows ─────────────────────────── */
  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let out = data.predictions;
    if (statusFilter !== 'all') out = out.filter((p) => p.status === statusFilter);
    if (q) {
      out = out.filter(
        (p) =>
          (p.ligand_name || '').toLowerCase().includes(q) ||
          (p.ligand_external_id || '').toLowerCase().includes(q) ||
          p.ligand_smiles.toLowerCase().includes(q),
      );
    }
    if (minPic50 > 0) out = out.filter((p) => (p.pic50 ?? -Infinity) >= minPic50);
    if (minBinder > 0) {
      out = out.filter((p) => (p.affinity_probability_binary ?? -Infinity) >= minBinder / 100);
    }
    if (lipinskiOnly) out = out.filter((p) => lipinski[p.ligand_smiles] === true);

    const dir = sortAsc ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = sortVal(a, sortKey);
      const bv = sortVal(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') return dir * av.localeCompare(bv);
      return dir * ((av as number) - (bv as number));
    });
    return out;
  }, [data, search, statusFilter, minPic50, minBinder, lipinskiOnly, lipinski, sortKey, sortAsc]);

  const summary = data?.campaign;

  function exportCsv() {
    if (!data) return;
    const header = [
      'rank',
      'name',
      'external_id',
      'smiles',
      'pic50',
      'ic50_nm',
      'binder_probability',
      'lipinski_pass',
      'status',
      'job_id',
    ];
    const lines = [header.join(',')];
    rows.forEach((p, i) => {
      const cols = [
        i + 1,
        csvEscape(p.ligand_name || ''),
        csvEscape(p.ligand_external_id || ''),
        csvEscape(p.ligand_smiles),
        p.pic50?.toFixed(3) ?? '',
        p.ic50_nm?.toFixed(2) ?? '',
        p.affinity_probability_binary?.toFixed(4) ?? '',
        lipinski[p.ligand_smiles] === true ? 'true' : lipinski[p.ligand_smiles] === false ? 'false' : '',
        p.status,
        p.job_id,
      ];
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screen_${params.campaignId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function header(label: string, key: SortKey, width: string, align: 'left' | 'right' | 'center' = 'left') {
    const active = sortKey === key;
    return (
      <button
        onClick={() => {
          if (active) setSortAsc(!sortAsc);
          else { setSortKey(key); setSortAsc(false); }
        }}
        className={`shrink-0 ${width} ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        } hover:text-foreground transition-colors`}
      >
        {label}
        {active && <span className="ml-0.5 text-muted-2">{sortAsc ? '↑' : '↓'}</span>}
      </button>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10">
        <XCircle className="h-8 w-8 text-red-400" />
        <p className="text-[12px] text-foreground">{error}</p>
        <Link href="/app/screen" className="text-[11px] text-blue-300 hover:underline">
          Back to screening
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-5">
        <Link
          href="/app/screen"
          className="flex h-7 items-center gap-1 text-[11px] text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          New screen
        </Link>
        <div className="h-4 w-px bg-[var(--border)]" />
        <div>
          <div className="text-[13px] font-semibold text-foreground">
            {summary?.name || 'Screening campaign'}
          </div>
          <div className="text-[10px] text-muted-2 tabular-nums">
            {summary?.uniprot_id} · {summary?.completed_count}/{summary?.total_ligands} complete
            {summary && summary.failed_count > 0 ? ` · ${summary.failed_count} failed` : ''}
            {summary?.completed_at ? ' · finished' : ' · running'}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex h-7 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[11px] font-medium text-foreground hover:bg-[var(--surface-hover)]"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filters bar */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Search className="h-3 w-3 text-muted-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or SMILES…"
            className="h-7 w-48 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-foreground placeholder:text-muted-2"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-2">Min pKi</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={minPic50}
            onChange={(e) => setMinPic50(parseFloat(e.target.value))}
            className="w-24 accent-blue-400"
          />
          <span className="w-6 tabular-nums text-foreground">{minPic50.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-2">Min binder %</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minBinder}
            onChange={(e) => setMinBinder(parseInt(e.target.value, 10))}
            className="w-24 accent-blue-400"
          />
          <span className="w-7 tabular-nums text-foreground">{minBinder}%</span>
        </div>

        <label className="flex items-center gap-1.5 text-muted">
          <input
            type="checkbox"
            checked={lipinskiOnly}
            onChange={(e) => setLipinskiOnly(e.target.checked)}
            className="h-3 w-3 accent-emerald-400"
          />
          Lipinski pass only
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-7 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-foreground"
        >
          <option value="all">Any status</option>
          <option value="complete">Complete</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
        </select>

        <span className="ml-auto text-muted-2 tabular-nums">
          {rows.length} of {data.predictions.length} rows
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 flex h-8 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 text-mono-label text-[9px]">
          {header('#', 'rank', 'w-8', 'right')}
          {header('Ligand', 'name', 'flex-1 min-w-[200px]')}
          {header('pKi', 'pic50', 'w-14', 'right')}
          {header('IC50', 'ic50_nm', 'w-20', 'right')}
          {header('Binder', 'binder', 'w-14', 'right')}
          <div className="w-12 shrink-0 text-center">Lip.</div>
          {header('Status', 'status', 'w-20', 'center')}
          <div className="w-24 shrink-0 text-right">Action</div>
        </div>

        {rows.map((p, i) => (
          <ResultRow
            key={p.job_id}
            rank={i + 1}
            p={p}
            lipinskiPass={lipinski[p.ligand_smiles]}
            onPredictComplex={() => setPredictTarget(p)}
          />
        ))}

        {rows.length === 0 && (
          <div className="flex h-32 items-center justify-center text-[11px] text-muted-2">
            No results match these filters.
          </div>
        )}
      </div>

      {/* Predict-complex modal reuses the existing AF3/Vina workflow */}
      {predictTarget && target && (
        <PredictionWorkflow
          isOpen={!!predictTarget}
          onClose={() => setPredictTarget(null)}
          targetInfo={target}
          ligand={{
            smiles: predictTarget.ligand_smiles,
            name: predictTarget.ligand_name || predictTarget.ligand_external_id || 'ligand',
          }}
        />
      )}
    </div>
  );
}

function ResultRow({
  rank,
  p,
  lipinskiPass,
  onPredictComplex,
}: {
  rank: number;
  p: AffinityPrediction;
  lipinskiPass: boolean | undefined;
  onPredictComplex: () => void;
}) {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] px-5 text-[11px] hover:bg-[var(--surface-hover)]">
      <div className="w-8 shrink-0 text-right tabular-nums text-muted-2">{rank}</div>
      <div className="flex-1 min-w-[200px] overflow-hidden">
        <div className="truncate font-medium text-foreground">
          {p.ligand_name || p.ligand_external_id || 'unnamed'}
        </div>
        <div className="truncate font-mono text-[10px] text-muted-2" title={p.ligand_smiles}>
          {p.ligand_smiles}
        </div>
      </div>
      <div className="w-14 shrink-0 text-right tabular-nums">
        {p.pic50 != null ? (
          <span className={pic50Color(p.pic50)}>{p.pic50.toFixed(2)}</span>
        ) : (
          <span className="text-muted-2">—</span>
        )}
      </div>
      <div className="w-20 shrink-0 text-right tabular-nums text-muted">
        {p.ic50_nm != null ? formatNm(p.ic50_nm) : '—'}
      </div>
      <div className="w-14 shrink-0 text-right tabular-nums text-muted">
        {p.affinity_probability_binary != null
          ? `${Math.round(p.affinity_probability_binary * 100)}%`
          : '—'}
      </div>
      <div className="flex w-12 shrink-0 items-center justify-center">
        {lipinskiPass === undefined ? (
          <span className="text-muted-2">—</span>
        ) : lipinskiPass ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>
      <div className="w-20 shrink-0 text-center">
        <StatusPill status={p.status} progress={p.progress} />
      </div>
      <div className="w-24 shrink-0 text-right">
        {p.status === 'complete' && (
          <button
            onClick={onPredictComplex}
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20"
          >
            Predict complex
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status, progress }: { status: AffinityPrediction['status']; progress?: number }) {
  const styles: Record<AffinityPrediction['status'], string> = {
    queued: 'bg-slate-500/20 text-slate-300',
    running: 'bg-blue-500/20 text-blue-300',
    complete: 'bg-emerald-500/20 text-emerald-300',
    failed: 'bg-red-500/20 text-red-300',
    expired: 'bg-amber-500/20 text-amber-300',
  };
  const label = status === 'running' && progress != null ? `Running ${progress}%` : status;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${styles[status]}`}>
      {label}
    </span>
  );
}

function pic50Color(p: number): string {
  if (p >= 7) return 'font-semibold text-emerald-400';
  if (p >= 5) return 'text-amber-400';
  return 'text-muted';
}

function sortVal(p: AffinityPrediction, key: SortKey): number | string | null | undefined {
  switch (key) {
    case 'rank': return p.created_at;
    case 'name': return (p.ligand_name || p.ligand_external_id || '').toLowerCase();
    case 'pic50': return p.pic50 ?? null;
    case 'ic50_nm': return p.ic50_nm ?? null;
    case 'binder': return p.affinity_probability_binary ?? null;
    case 'status': return p.status;
  }
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
