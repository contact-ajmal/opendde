'use client';

import { useState } from 'react';
import { Dna, Sparkles, Star, Loader2, Download } from 'lucide-react';
import { apiPost } from '@/lib/api';
import dynamic from 'next/dynamic';
import type { PocketHighlight } from '@/components/MolstarViewer';

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CdrRegion {
  name: string;
  residues: number[];
  chain: string;
  length: number;
}

interface PredictionResult {
  pdb_url: string;
  cdr_regions: CdrRegion[];
  heavy_length: number;
  light_length: number;
}

const CDR_COLORS: Record<string, string> = {
  H1: '#3b82f6',
  H2: '#06b6d4',
  H3: '#ef4444',
  L1: '#93c5fd',
  L2: '#67e8f9',
  L3: '#fca5a5',
};

const PRESETS = [
  {
    short: 'Trastuzumab',
    name: 'Trastuzumab (Herceptin)',
    heavy:
      'EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS',
    light:
      'DIQMTQSPSSLSASVGDRVTITCRASQDVNTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSRSGTDFTLTISSLQPEDFATYYCQQHYTTPPTFGQGTKVEIK',
  },
  {
    short: 'Adalimumab',
    name: 'Adalimumab (Humira)',
    heavy:
      'EVQLVESGGGLVQPGRSLRLSCAASGFTFDDYAMHWVRQAPGKGLEWVSAITWNSGHIDYADSVEGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAKVSYLSTASSLDYWGQGTLVTVSS',
    light:
      'DIQMTQSPSSLSASVGDRVTITCRASQGIRNYLAWYQQKPGKAPKLLIYAASTLQSGVPSRFSGSGSGTDFTLTISSLQPEDVATYYCQRYNRAPYTFGQGTKVEIK',
  },
];

/* ── Empty-state antibody silhouette (Y shape) ────────── */
function AntibodySilhouette() {
  return (
    <svg viewBox="0 0 200 200" className="h-32 w-32 opacity-30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Heavy chains (upper arms) */}
      <path d="M100 110 L60 50" />
      <path d="M100 110 L140 50" />
      {/* Light chain attachments */}
      <path d="M60 50 L50 25" />
      <path d="M140 50 L150 25" />
      {/* Stem (Fc region) */}
      <path d="M100 110 L100 175" />
      {/* Disulfide bond marks */}
      <circle cx="100" cy="110" r="4" fill="currentColor" />
      <circle cx="80" cy="80" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="120" cy="80" r="3" fill="currentColor" opacity="0.6" />
      {/* Variable tips */}
      <circle cx="60" cy="50" r="5" />
      <circle cx="140" cy="50" r="5" />
      <circle cx="50" cy="25" r="4" />
      <circle cx="150" cy="25" r="4" />
    </svg>
  );
}

export default function AntibodyPage() {
  const [heavy, setHeavy] = useState('');
  const [light, setLight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  async function handlePredict() {
    if (!heavy.trim() || !light.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data: PredictionResult = await apiPost('/antibody/predict', {
        heavy_chain: heavy.trim(),
        light_chain: light.trim(),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(preset: (typeof PRESETS)[0]) {
    setHeavy(preset.heavy);
    setLight(preset.light);
    setResult(null);
    setError(null);
  }

  const cdrHighlights: PocketHighlight[] = result
    ? result.cdr_regions.map((cdr, i) => ({
        rank: i + 1,
        residues: cdr.residues.map((r) => `${cdr.chain}_${r}`),
        selected: cdr.name === 'H3',
        color: CDR_COLORS[cdr.name],
      }))
    : [];

  const heavyCount = heavy.replace(/\s/g, '').length;
  const lightCount = light.replace(/\s/g, '').length;
  const canPredict = heavyCount > 0 && lightCount > 0 && !loading;

  return (
    <div className="flex h-full flex-col">
      {/* ── Compact header (36px) ─────────────────── */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
        <Dna className="h-4 w-4 text-emerald-400" />
        <h1 className="text-sm font-semibold text-foreground">Antibody structure prediction</h1>
        <span className="text-[11px] text-muted-2">Powered by ImmuneBuilder</span>
        {result && (
          <a
            href={`${API_BASE}${result.pdb_url}`}
            download
            className="ml-auto flex h-6 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[10px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Download className="h-3 w-3 text-purple-400" />
            Download PDB
          </a>
        )}
      </header>

      {/* ── Two-column body ─────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* ── Left: sequences + CDR legend (50%) ── */}
        <section className="flex w-1/2 min-w-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)]">
          <div className="flex h-8 shrink-0 items-center border-b border-[var(--border)] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
              Sequences
            </span>
          </div>

          <div className="space-y-3 p-3">
            <SequenceBox
              label="Heavy chain (VH)"
              value={heavy}
              onChange={setHeavy}
              count={heavyCount}
              placeholder="EVQLVESGGGLVQPGGSLRLSCAAS…"
            />
            <SequenceBox
              label="Light chain (VL)"
              value={light}
              onChange={setLight}
              count={lightCount}
              placeholder="DIQMTQSPSSLSASVGDRVTITCR…"
            />

            {/* Presets inline */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-2">Presets</span>
              {PRESETS.map((p) => (
                <button
                  key={p.short}
                  onClick={() => applyPreset(p)}
                  className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-0.5 text-[11px] text-muted hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                >
                  {p.short}
                </button>
              ))}
            </div>

            {/* Predict button */}
            <button
              onClick={handlePredict}
              disabled={!canPredict}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 text-[12px] font-semibold text-white hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Predicting… 30-60s on first run
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Predict structure
                </>
              )}
            </button>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2 text-[11px] text-red-400">
                {error}
              </div>
            )}

            {/* CDR annotations — only after prediction */}
            {result && (
              <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                    CDR annotations
                  </span>
                  <span className="text-[10px] text-muted-2 tabular-nums">
                    H:{result.heavy_length} · L:{result.light_length}
                  </span>
                </div>
                {result.cdr_regions.map((cdr) => {
                  const isH3 = cdr.name === 'H3';
                  const first = cdr.residues[0];
                  const last = cdr.residues[cdr.residues.length - 1];
                  return (
                    <div
                      key={cdr.name}
                      className={`flex items-center gap-2 rounded px-2 py-1 text-[11px] ${
                        isH3 ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <div
                        className="h-2.5 w-6 shrink-0 rounded-sm"
                        style={{ backgroundColor: CDR_COLORS[cdr.name] || '#64748b' }}
                      />
                      <span className={`font-semibold w-6 ${isH3 ? 'text-red-400' : 'text-foreground'}`}>
                        {cdr.name}
                      </span>
                      <span className="text-muted-2">residues</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {first}–{last}
                      </span>
                      {isH3 && <Star className="ml-auto h-3 w-3 fill-red-400 text-red-400" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Right: viewer + CDR table (50%) ──── */}
        <section className="flex w-1/2 min-w-0 flex-col">
          {/* 3D viewer */}
          <div className="relative flex-1 basis-0 min-h-0 bg-black">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-2">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                <p className="text-xs text-muted">Running ImmuneBuilder…</p>
                <p className="text-[10px] text-muted-2">Heavy · Light → Fab structure</p>
              </div>
            ) : result ? (
              <StructureViewer
                structureUrl={`${API_BASE}${result.pdb_url}`}
                height="100%"
                pocketHighlights={cdrHighlights}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-2">
                <AntibodySilhouette />
                <p className="text-xs font-medium text-muted">Predict to see structure</p>
                <p className="text-[10px] text-muted-2">Paste sequences or pick a preset on the left</p>
              </div>
            )}
          </div>

          {/* CDR table */}
          <div className="flex max-h-[40%] shrink-0 flex-col border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                CDR regions (Chothia)
              </span>
              {result && (
                <span className="text-[10px] text-muted-2 tabular-nums">
                  {result.cdr_regions.length} regions
                </span>
              )}
            </div>

            {!result ? (
              <div className="flex flex-1 items-center justify-center p-4">
                <p className="text-[11px] text-muted-2">CDR regions appear after prediction</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-2 border-b border-[var(--border)]">
                  <div className="w-6">Region</div>
                  <div>Chain</div>
                  <div className="text-right">Length</div>
                  <div className="text-right">Range</div>
                  <div className="w-4" />
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {result.cdr_regions.map((cdr) => {
                    const isH3 = cdr.name === 'H3';
                    const first = cdr.residues[0];
                    const last = cdr.residues[cdr.residues.length - 1];
                    return (
                      <div
                        key={cdr.name}
                        className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-x-3 px-3 py-1.5 text-[11px] ${
                          isH3 ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <div className="flex w-6 items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-sm"
                            style={{ backgroundColor: CDR_COLORS[cdr.name] || '#64748b' }}
                          />
                          <span className={`font-semibold ${isH3 ? 'text-red-400' : 'text-foreground'}`}>
                            {cdr.name}
                          </span>
                        </div>
                        <div className="text-muted">{cdr.chain === 'H' ? 'Heavy' : 'Light'}</div>
                        <div className="text-right tabular-nums text-foreground">{cdr.length}</div>
                        <div className="text-right font-mono tabular-nums text-muted-2">
                          {first}–{last}
                        </div>
                        <div className="w-4">
                          {isH3 && <Star className="h-3 w-3 fill-red-400 text-red-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Compact sequence textarea ───────────────────────── */
function SequenceBox({
  label,
  value,
  onChange,
  count,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  count: number;
  placeholder: string;
}) {
  return (
    <div className="relative rounded-md border border-[var(--border)] bg-[var(--bg)] focus-within:border-emerald-500/50 transition-colors">
      <div className="flex items-center justify-between px-2 pt-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-2">
          {label}
        </span>
        <span className="text-[9px] tabular-nums text-muted-2">{count} aa</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full resize-none bg-transparent px-2 pb-2 pt-1 font-mono text-[11px] leading-snug text-foreground placeholder:text-muted-2/60 outline-none"
      />
    </div>
  );
}
