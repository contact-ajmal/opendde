'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Upload,
  Zap,
  Database,
  ClipboardPaste,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { submitScreen, pollCampaign } from '@/lib/affinity';
import { parseLigandText, ligandsToText, formatNm, type ParsedLigand } from '@/lib/screen-utils';
import AboutBoltz2 from '@/components/AboutBoltz2';
import BoltzWarmupBanner from '@/components/BoltzWarmupBanner';
import type {
  AffinityPrediction,
  CampaignStatusResponse,
  KnownLigand,
  PocketResult,
  PocketsResponse,
  TargetInfo,
} from '@/lib/types';

interface RecentTarget {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
}

interface FdaDrug {
  name: string;
  smiles: string;
  chembl_id?: string;
}

type LigandSource = 'paste' | 'upload' | 'chembl' | 'fda';

const SMILES_VALIDATE_DEBOUNCE_MS = 600;
const TOP_RESULTS_COUNT = 20;

export default function ScreenPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-2" /></div>}>
      <ScreenInner />
    </Suspense>
  );
}

function ScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Target + pocket state
  const [recentTargets, setRecentTargets] = useState<RecentTarget[]>([]);
  const [uniprotId, setUniprotId] = useState<string>(searchParams.get('target') || '');
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [pockets, setPockets] = useState<PocketResult[]>([]);
  const [pocketRank, setPocketRank] = useState<number | null>(null);

  // Ligand source + state
  const [source, setSource] = useState<LigandSource>('paste');
  const [pasteText, setPasteText] = useState('');
  const [ligands, setLigands] = useState<ParsedLigand[]>([]);
  const [ligandsLoading, setLigandsLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  // Submit / campaign state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignStatusResponse | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  /* ── Recent targets bootstrap ──────────────────────────── */
  useEffect(() => {
    apiGet('/stats')
      .then((s: any) => {
        const recents = (s.recent_targets || []) as RecentTarget[];
        setRecentTargets(recents);
        if (!uniprotId && recents.length > 0) {
          setUniprotId(recents[0].uniprot_id);
        }
      })
      .catch(() => { /* best-effort */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Resolve target + pockets when uniprotId changes ───── */
  useEffect(() => {
    if (!uniprotId) {
      setTarget(null);
      setPockets([]);
      return;
    }
    let cancelled = false;
    setTargetLoading(true);
    setTargetError(null);
    Promise.all([
      apiGet(`/targets/${uniprotId}`) as Promise<TargetInfo>,
      apiGet(`/pockets/${uniprotId}`).catch(() => null) as Promise<PocketsResponse | null>,
    ])
      .then(([t, p]) => {
        if (cancelled) return;
        setTarget(t);
        const list = p?.pockets || [];
        setPockets(list);
        if (list.length > 0 && pocketRank == null) setPocketRank(list[0].rank);
      })
      .catch((e) => {
        if (cancelled) return;
        setTargetError((e as Error).message);
        setTarget(null);
        setPockets([]);
      })
      .finally(() => {
        if (!cancelled) setTargetLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniprotId]);

  /* ── Re-parse paste textarea on edit ───────────────────── */
  useEffect(() => {
    if (source !== 'paste') return;
    setLigands(parseLigandText(pasteText));
  }, [pasteText, source]);

  /* ── Debounced SMILES validation via /api/v1/validate ──── */
  useEffect(() => {
    if (ligands.length === 0) return;
    const handle = setTimeout(async () => {
      setValidating(true);
      try {
        const results = await Promise.all(
          ligands.map((l) =>
            apiPost('/validate', { smiles: l.smiles }).catch(() => ({ valid: false, error: 'request failed' })),
          ),
        );
        setLigands((prev) =>
          prev.map((l, i) => ({
            ...l,
            valid: !!results[i]?.valid,
            error: results[i]?.error || (results[i]?.valid ? undefined : 'Invalid SMILES'),
          })),
        );
      } finally {
        setValidating(false);
      }
    }, SMILES_VALIDATE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligands.map((l) => l.smiles).join('|')]);

  /* ── Cancel any in-flight campaign poll on unmount ─────── */
  useEffect(() => () => { cancelRef.current?.(); }, []);

  /* ── Source-specific loaders ────────────────────────────── */
  const loadChembl = useCallback(async () => {
    if (!uniprotId) return;
    setLigandsLoading(true);
    try {
      const r = (await apiGet(`/ligands/${uniprotId}`)) as { ligands: KnownLigand[] };
      setLigands(
        r.ligands
          .filter((l) => !!l.smiles)
          .map((l) => ({ name: l.name, smiles: l.smiles, external_id: l.chembl_id })),
      );
    } finally {
      setLigandsLoading(false);
    }
  }, [uniprotId]);

  const loadFda = useCallback(async () => {
    setLigandsLoading(true);
    try {
      const resp = await fetch('/data/fda_approved_drugs.json');
      const data = (await resp.json()) as { drugs: FdaDrug[] };
      setLigands(
        data.drugs.map((d) => ({ name: d.name, smiles: d.smiles, external_id: d.chembl_id })),
      );
    } finally {
      setLigandsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (source === 'chembl') void loadChembl();
    else if (source === 'fda') void loadFda();
    else if (source === 'paste') setLigands(parseLigandText(pasteText));
    // 'upload' is event-driven
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      // .csv: assume first column is name, second is smiles, optional header
      if (file.name.endsWith('.csv')) {
        const lines = text.split(/\r?\n/);
        const startsWithHeader =
          lines[0] && lines[0].toLowerCase().includes('smiles');
        const body = startsWithHeader ? lines.slice(1).join('\n') : text;
        setPasteText(body);
      } else {
        // .smi / .txt: SMILES<TAB>name OR SMILES<space>name (RDKit convention)
        // Re-emit as our preferred name<TAB>smiles by swapping if heuristics say so.
        const swapped = text
          .split(/\r?\n/)
          .map((line) => {
            const t = line.trim();
            if (!t || t.startsWith('#')) return line;
            const parts = t.split(/\s+/);
            if (parts.length >= 2 && /[A-Za-z]/.test(parts[0]) && /[\(\)\[\]=#@\\\/]/.test(parts[0])) {
              // first token looks like SMILES → swap to name<TAB>smiles
              const smi = parts[0];
              const nm = parts.slice(1).join(' ');
              return `${nm}\t${smi}`;
            }
            return line;
          })
          .join('\n');
        setPasteText(swapped);
      }
      setSource('paste');
    };
    reader.readAsText(file);
  }

  /* ── Submit ────────────────────────────────────────────── */
  const validLigands = useMemo(() => ligands.filter((l) => l.valid !== false && l.smiles), [ligands]);
  const invalidCount = ligands.length - validLigands.length;
  const canStart =
    !!uniprotId && !!target && validLigands.length > 0 && !submitting && !validating;

  async function handleStart() {
    if (!canStart || !target) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const resp = await submitScreen(
        uniprotId,
        validLigands.map((l) => ({ smiles: l.smiles, name: l.name, external_id: l.external_id })),
        {
          pocket_rank: pocketRank ?? undefined,
          campaign_name: `Screen vs ${target.gene_name || uniprotId}`,
        },
      );
      setCampaignId(resp.campaign_id);
      cancelRef.current?.();
      cancelRef.current = pollCampaign(resp.campaign_id, setCampaign);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── ETA ───────────────────────────────────────────────── */
  const eta = useMemo(() => {
    if (!campaign) return null;
    const { total_ligands, completed_count, failed_count, created_at } = campaign.campaign;
    const done = completed_count + failed_count;
    const remaining = total_ligands - done;
    if (remaining <= 0) return null;
    if (done < 3) return 'Estimating…';
    const elapsedMs = Date.now() - new Date(created_at).getTime();
    const perJob = elapsedMs / done;
    return `~${Math.max(1, Math.round((perJob * remaining) / 60_000))} min`;
  }, [campaign]);

  const topResults = useMemo(() => {
    if (!campaign) return [];
    return [...campaign.predictions]
      .filter((p) => p.status === 'complete')
      .sort((a, b) => (b.pic50 ?? -Infinity) - (a.pic50 ?? -Infinity))
      .slice(0, TOP_RESULTS_COUNT);
  }, [campaign]);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5">
        <FlaskConical className="h-4 w-4 text-blue-400" />
        <h1 className="text-[14px] font-semibold text-foreground">Virtual screening</h1>
        <span className="text-[11px] text-muted-2">
          Boltz-2 affinity prediction across many ligands
        </span>
      </header>

      <BoltzWarmupBanner armed={!!campaignId} />

      <div className="flex flex-1 min-h-0">
        {/* ── Left: configuration ─────────────────────────── */}
        <section className="flex w-1/2 min-w-[420px] flex-col gap-4 overflow-y-auto border-r border-[var(--border)] p-5">
          {/* Target + pocket */}
          <div>
            <SectionHeader index={1} label="Target" />
            <div className="space-y-2">
              <select
                value={uniprotId}
                onChange={(e) => {
                  setUniprotId(e.target.value);
                  setPocketRank(null);
                }}
                className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-foreground"
              >
                <option value="">Choose a target…</option>
                {recentTargets.map((t) => (
                  <option key={t.uniprot_id} value={t.uniprot_id}>
                    {(t.gene_name || t.name) + ' '}({t.uniprot_id})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or enter UniProt ID (e.g. P00533)"
                  className="h-8 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 font-mono text-[11px] text-foreground placeholder:text-muted-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim().toUpperCase();
                      if (v) setUniprotId(v);
                    }
                  }}
                />
                {targetLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-2" />}
              </div>

              {targetError && (
                <p className="text-[11px] text-red-400">{targetError}</p>
              )}
              {target && (
                <p className="text-[11px] text-muted-2">
                  <span className="font-medium text-foreground">{target.name}</span>
                  {target.organism ? ` · ${target.organism}` : ''} · {target.length} aa
                </p>
              )}

              {pockets.length > 0 && (
                <select
                  value={pocketRank ?? ''}
                  onChange={(e) =>
                    setPocketRank(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-foreground"
                >
                  <option value="">No pocket constraint</option>
                  {pockets.map((p) => (
                    <option key={p.rank} value={p.rank}>
                      {`#${p.rank} · druggability ${(p.druggability * 100).toFixed(0)}%`}
                    </option>
                  ))}
                </select>
              )}
              {pockets.length > 0 && (
                <p className="text-[10px] text-muted-2">
                  Pocket selection is recorded with the campaign but not yet used to bias the prediction.
                </p>
              )}
            </div>
          </div>

          {/* Ligand source */}
          <div>
            <SectionHeader index={2} label="Ligand library" />
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <SourceTile current={source} value="paste" onPick={setSource} icon={<ClipboardPaste className="h-3 w-3" />}>
                Paste SMILES
              </SourceTile>
              <SourceTile current={source} value="upload" onPick={setSource} icon={<Upload className="h-3 w-3" />}>
                Upload .smi / .csv
              </SourceTile>
              <SourceTile current={source} value="chembl" onPick={setSource} icon={<Database className="h-3 w-3" />}>
                ChEMBL known ligands
              </SourceTile>
              <SourceTile current={source} value="fda" onPick={setSource} icon={<Database className="h-3 w-3" />}>
                FDA-approved set
              </SourceTile>
            </div>

            <div className="mt-3">
              {source === 'paste' && (
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`name<TAB>smiles per line, e.g.\nerlotinib\tCOc1cc2ncnc(Nc3...\ngefitinib\tCOc1cc2c(Nc3ccc...\n#aspirin\tCC(=O)Oc1ccccc1C(=O)O`}
                  spellCheck={false}
                  className="h-44 w-full resize-none rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-[11px] text-foreground placeholder:text-muted-2"
                />
              )}
              {source === 'upload' && (
                <FileDrop onFile={handleFile} />
              )}
              {(source === 'chembl' || source === 'fda') && (
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 text-[11px] text-muted">
                  {ligandsLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                    </span>
                  ) : ligands.length === 0 ? (
                    source === 'chembl'
                      ? 'No known ligands available for this target.'
                      : 'FDA-approved set is empty.'
                  ) : (
                    <details>
                      <summary className="cursor-pointer text-foreground">
                        {ligands.length} ligand{ligands.length === 1 ? '' : 's'} loaded — click to preview
                      </summary>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-muted">
                        {ligandsToText(ligands.slice(0, 50))}
                        {ligands.length > 50 ? `\n…+${ligands.length - 50} more` : ''}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <LigandCounts
              total={ligands.length}
              invalid={invalidCount}
              validating={validating}
            />
          </div>

          {/* Run */}
          <div>
            <SectionHeader index={3} label="Run" />
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 text-[13px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Zap className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Start screening'}
            </button>
            {submitError && <p className="mt-2 text-[11px] text-red-400">{submitError}</p>}
            {!canStart && !submitError && ligands.length === 0 && (
              <p className="mt-2 text-[11px] text-muted-2">
                Add at least one valid SMILES to enable screening.
              </p>
            )}
          </div>

          <div className="mt-2">
            <AboutBoltz2 />
          </div>
        </section>

        {/* ── Right: live results ─────────────────────────── */}
        <section className="flex w-1/2 flex-col overflow-hidden">
          {!campaignId ? (
            <EmptyResults />
          ) : (
            <LiveResults
              campaign={campaign}
              eta={eta}
              topResults={topResults}
              onOpen={() => router.push(`/app/screen/results/${campaignId}`)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function SectionHeader({ index, label }: { index: number; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-mono-label text-[10px]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-alt)] font-semibold text-foreground">
        {index}
      </span>
      <span className="text-foreground">{label}</span>
    </div>
  );
}

function SourceTile({
  current,
  value,
  onPick,
  icon,
  children,
}: {
  current: LigandSource;
  value: LigandSource;
  onPick: (v: LigandSource) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onPick(value)}
      className={`flex h-8 items-center gap-1.5 rounded-md border px-2 transition-colors ${
        active
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          : 'border-[var(--border)] bg-[var(--bg)] text-muted hover:bg-[var(--surface-hover)] hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function LigandCounts({
  total,
  invalid,
  validating,
}: {
  total: number;
  invalid: number;
  validating: boolean;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-2 flex items-center gap-2 text-[11px]">
      <span className="rounded-full bg-[var(--surface-alt)] px-2 py-0.5 text-foreground tabular-nums">
        {total} ligand{total === 1 ? '' : 's'} detected
      </span>
      {validating ? (
        <span className="flex items-center gap-1 text-muted-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Validating…
        </span>
      ) : invalid > 0 ? (
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-red-400">
          <AlertTriangle className="h-3 w-3" />
          {invalid} invalid SMILES
        </span>
      ) : (
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> all SMILES valid
        </span>
      )}
    </div>
  );
}

function FileDrop({ onFile }: { onFile: (f: File) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-[11px] transition-colors ${
        hover
          ? 'border-blue-500/60 bg-blue-500/5 text-blue-300'
          : 'border-[var(--border)] bg-[var(--bg)] text-muted-2 hover:border-[var(--border-hover)]'
      }`}
    >
      <Upload className="h-4 w-4" />
      <span>Drop a .smi or .csv file, or click to choose</span>
      <input
        type="file"
        accept=".smi,.csv,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

function EmptyResults() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <FlaskConical className="h-10 w-10 text-muted-2" />
      <p className="text-[13px] text-foreground">Configure your screen and click Start screening</p>
      <p className="max-w-md text-[11px] text-muted-2">
        Live progress, top hits, and a ranked results table will appear here once the campaign starts.
      </p>
    </div>
  );
}

function LiveResults({
  campaign,
  eta,
  topResults,
  onOpen,
}: {
  campaign: CampaignStatusResponse | null;
  eta: string | null;
  topResults: AffinityPrediction[];
  onOpen: () => void;
}) {
  const total = campaign?.campaign.total_ligands ?? 0;
  const done = (campaign?.completed_count ?? 0) + (campaign?.failed_count ?? 0);
  const queued = total - done - (campaign?.predictions.filter((p) => p.status === 'running').length ?? 0);
  const running = campaign?.predictions.filter((p) => p.status === 'running').length ?? 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="flex h-full flex-col p-5">
      <h2 className="mb-3 text-mono-label text-[10px] text-muted">Live results</h2>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="grid grid-cols-4 gap-2 text-[11px]">
          <Stat label="Queued" value={Math.max(queued, 0)} tone="muted" />
          <Stat label="Running" value={running} tone="blue" />
          <Stat label="Done" value={campaign?.completed_count ?? 0} tone="emerald" />
          <Stat label="Failed" value={campaign?.failed_count ?? 0} tone="red" />
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-2 tabular-nums">
          <span>
            {done} of {total} jobs
          </span>
          {eta && <span>ETA {eta}</span>}
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-md border border-[var(--border)]">
        <div className="flex h-8 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 text-mono-label text-[9px]">
          <div className="w-6 shrink-0 text-right">#</div>
          <div className="flex-1">Ligand</div>
          <div className="w-12 shrink-0 text-right">pKi</div>
          <div className="w-16 shrink-0 text-right">IC50</div>
          <div className="w-14 shrink-0 text-right">Binder</div>
        </div>
        <div className="h-full overflow-y-auto">
          {topResults.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[11px] text-muted-2">
              {done === 0 ? 'Waiting for first results…' : 'Sorting top hits…'}
            </div>
          ) : (
            topResults.map((p, i) => (
              <div
                key={p.job_id}
                className="flex h-9 items-center gap-2 border-b border-[var(--border)] px-3 text-[11px] last:border-0 hover:bg-[var(--surface-hover)]"
              >
                <div className="w-6 shrink-0 text-right tabular-nums text-muted-2">{i + 1}</div>
                <div className="flex-1 truncate">
                  <span className="font-medium text-foreground">{p.ligand_name || p.ligand_external_id || 'unnamed'}</span>
                </div>
                <div className="w-12 shrink-0 text-right font-semibold tabular-nums text-emerald-400">
                  {p.pic50?.toFixed(1) ?? '—'}
                </div>
                <div className="w-16 shrink-0 text-right tabular-nums text-muted">
                  {p.ic50_nm != null ? formatNm(p.ic50_nm) : '—'}
                </div>
                <div className="w-14 shrink-0 text-right tabular-nums text-muted">
                  {p.affinity_probability_binary != null
                    ? `${Math.round(p.affinity_probability_binary * 100)}%`
                    : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={onOpen}
        className="mt-4 flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 text-[12px] font-medium text-foreground transition-colors hover:bg-[var(--surface-hover)]"
      >
        Open results →
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'muted' | 'blue' | 'emerald' | 'red';
}) {
  const colors: Record<typeof tone, string> = {
    muted: 'text-muted',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
  };
  return (
    <div className="rounded-sm border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-center">
      <div className="text-mono-label text-[9px] text-muted-2">{label}</div>
      <div className={`mt-0.5 text-[18px] font-semibold tabular-nums ${colors[tone]}`}>{value}</div>
    </div>
  );
}

