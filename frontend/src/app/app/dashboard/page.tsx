'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Crosshair,
  Beaker,
  FileText,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

/* ── Types ─────────────────────────────────────────────── */
interface RecentTarget {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
  resolved_at: string;
  pocket_count?: number;
  ligand_count?: number;
}

interface RecentPrediction {
  prediction_id: string;
  target_id: string | null;
  ligand_name: string | null;
  status: string;
  created_at: string;
}

interface StatsData {
  targets_explored: number;
  total_pockets_found: number;
  total_ligands_catalogued: number;
  predictions_completed: number;
  recent_targets: RecentTarget[];
  recent_predictions?: RecentPrediction[];
}

/* ── Helpers ───────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

const POPULAR_TARGETS = [
  { gene: 'EGFR', desc: 'Lung cancer' },
  { gene: 'CDK2', desc: 'Cell cycle' },
  { gene: 'BRAF', desc: 'Melanoma' },
  { gene: 'ACE2', desc: 'COVID-19' },
  { gene: 'BCL2', desc: 'Apoptosis' },
  { gene: 'TP53', desc: 'Tumor sup.' },
];

/* ── Prominent search bar ──────────────────────────────── */
function DashboardSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost('/target/resolve', { query: trimmed });
      router.push(`/app/target/${result.uniprot_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve target');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex h-12 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-emerald-500">
        <Search className="ml-4 h-4 w-4 shrink-0 text-muted-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any protein target by name, gene, or UniProt ID…"
          autoFocus={autoFocus}
          className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-2 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="mr-1.5 flex h-9 items-center gap-1.5 rounded-md bg-emerald-500 px-4 text-xs font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              Search
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </form>
  );
}

/* ── Stat pill ─────────────────────────────────────────── */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-16 flex-col justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4">
      <div className="text-xl font-bold leading-none text-foreground tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
        {label}
      </div>
    </div>
  );
}

/* ── Prediction status icon ────────────────────────────── */
function PredictionStatusBadge({ status }: { status: string }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] font-medium text-muted">
      <Circle className="h-3 w-3" /> Prepared
    </span>
  );
}

/* ── Popular target chips (first-run state) ───────────── */
function PopularTargetChips() {
  const router = useRouter();
  const [loadingGene, setLoadingGene] = useState<string | null>(null);

  async function go(gene: string) {
    setLoadingGene(gene);
    try {
      const result = await apiPost('/target/resolve', { query: gene });
      router.push(`/app/target/${result.uniprot_id}`);
    } catch {
      setLoadingGene(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_TARGETS.map((t) => (
        <button
          key={t.gene}
          onClick={() => go(t.gene)}
          disabled={loadingGene !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          <span className="font-semibold text-foreground">{t.gene}</span>
          <span className="text-muted-2">— {t.desc}</span>
          {loadingGene === t.gene && <Loader2 className="h-3 w-3 animate-spin text-muted-2" />}
        </button>
      ))}
    </div>
  );
}

/* ── Dashboard page ────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard — OpenDDE';
    apiGet('/stats')
      .then((data: StatsData) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  /* ── Loading ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
      </div>
    );
  }

  /* ── First-run / empty state ─────────────────────── */
  if (!stats || stats.targets_explored === 0) {
    return (
      <div className="flex h-full flex-col p-6">
        {/* Search bar (same position as populated state) */}
        <div className="shrink-0">
          <DashboardSearch autoFocus />
        </div>

        {/* Centered welcome content fills remaining space */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to OpenDDE</h1>
            <p className="mt-1 text-sm text-muted">Start by searching a protein target above.</p>
          </div>

          <div className="w-full max-w-2xl">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
              Popular targets
            </div>
            <PopularTargetChips />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] font-bold text-emerald-400">1</span>
            <span>Search a target</span>
            <ArrowRight className="h-3 w-3 text-muted-2" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] font-bold text-emerald-400">2</span>
            <span>Explore pockets</span>
            <ArrowRight className="h-3 w-3 text-muted-2" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] font-bold text-emerald-400">3</span>
            <span>Analyze ligands</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Populated state ─────────────────────────────── */
  const recentPredictions = stats.recent_predictions ?? [];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Search bar */}
      <div className="shrink-0">
        <DashboardSearch />
      </div>

      {/* Stat row */}
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Targets explored" value={stats.targets_explored} />
        <Stat label="Pockets found" value={stats.total_pockets_found} />
        <Stat label="Ligands catalogued" value={stats.total_ligands_catalogued} />
        <Stat label="Predictions complete" value={stats.predictions_completed} />
      </div>

      {/* Main two-column row: recent targets + quick actions */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Recent targets (60%) */}
        <div className="col-span-1 flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] lg:col-span-3">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-2">
              Recent targets
            </h2>
            <span className="text-[10px] text-muted-2">{stats.recent_targets.length} shown</span>
          </div>

          {stats.recent_targets.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-2">
              No targets yet
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">
                    <th className="px-4 py-2 text-left">Gene</th>
                    <th className="px-4 py-2 text-left">UniProt</th>
                    <th className="px-4 py-2 text-right">Pockets</th>
                    <th className="px-4 py-2 text-right">Ligands</th>
                    <th className="px-4 py-2 text-right">Used</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_targets.map((t) => (
                    <tr
                      key={t.uniprot_id}
                      onClick={() => router.push(`/app/target/${t.uniprot_id}`)}
                      className="group cursor-pointer border-t border-[var(--border)] text-sm transition-colors hover:bg-[var(--surface-hover)]"
                      style={{ height: '36px' }}
                    >
                      <td className="px-4 py-0 font-medium text-foreground">
                        {t.gene_name || '—'}
                      </td>
                      <td className="px-4 py-0 font-mono text-xs text-muted">{t.uniprot_id}</td>
                      <td className="px-4 py-0 text-right tabular-nums text-muted">
                        {t.pocket_count ?? 0}
                      </td>
                      <td className="px-4 py-0 text-right tabular-nums text-muted">
                        {t.ligand_count ?? 0}
                      </td>
                      <td className="px-4 py-0 text-right text-xs text-muted-2">
                        {timeAgo(t.resolved_at)}
                      </td>
                      <td className="px-2 py-0 text-right">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-2 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions (40%) */}
        <div className="col-span-1 flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] lg:col-span-2">
          <div className="flex h-10 shrink-0 items-center border-b border-[var(--border)] px-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-2">
              Quick actions
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="protein target"]')?.focus()}
              className="flex h-10 items-center gap-2.5 rounded-md border border-[var(--border)] px-3 text-xs text-foreground transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
            >
              <Crosshair className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium">New target search</span>
            </button>

            <Link
              href="/app/antibody"
              className="flex h-10 items-center gap-2.5 rounded-md border border-[var(--border)] px-3 text-xs text-foreground transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
            >
              <Beaker className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-medium">Predict antibody</span>
            </Link>

            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex h-10 items-center gap-2.5 rounded-md border border-[var(--border)] px-3 text-xs text-foreground transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">Generate report</span>
            </button>

            <Link
              href="/app/analytics"
              className="flex h-10 items-center gap-2.5 rounded-md border border-[var(--border)] px-3 text-xs text-foreground transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
            >
              <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-medium">View analytics</span>
            </Link>

            {/* Example targets compact row */}
            <div className="mt-auto border-t border-[var(--border)] pt-2">
              <div className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-widest text-muted-2">
                Example targets
              </div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_TARGETS.slice(0, 6).map((t) => (
                  <button
                    key={t.gene}
                    onClick={async () => {
                      try {
                        const r = await apiPost('/target/resolve', { query: t.gene });
                        router.push(`/app/target/${r.uniprot_id}`);
                      } catch {}
                    }}
                    className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-foreground hover:border-[var(--border-hover)] transition-colors"
                  >
                    {t.gene}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active predictions */}
      {recentPredictions.length > 0 && (
        <div className="shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-2">
              Active predictions
            </h2>
            <span className="text-[10px] text-muted-2">{recentPredictions.length} recent</span>
          </div>
          <div className="max-h-[120px] overflow-y-auto">
            {recentPredictions.map((p) => (
              <div
                key={p.prediction_id}
                className="flex items-center gap-3 border-t border-[var(--border)] px-4 text-sm first:border-t-0"
                style={{ height: '36px' }}
              >
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {p.ligand_name || 'Custom ligand'}
                </span>
                <span className="text-muted-2">+</span>
                <span className="font-mono text-xs text-muted">{p.target_id || '—'}</span>
                <div className="flex-1" />
                <PredictionStatusBadge status={p.status} />
                {p.target_id && (
                  <Link
                    href={`/app/target/${p.target_id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {p.status === 'complete' ? 'View' : 'Continue'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
