'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import StructureViewer, { type PocketHighlight } from '@/components/StructureViewer';

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
    name: 'Trastuzumab (Herceptin)',
    heavy:
      'EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS',
    light:
      'DIQMTQSPSSLSASVGDRVTITCRASQDVNTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSRSGTDFTLTISSLQPEDFATYYCQQHYTTPPTFGQGTKVEIK',
  },
  {
    name: 'Adalimumab (Humira)',
    heavy:
      'EVQLVESGGGLVQPGRSLRLSCAASGFTFDDYAMHWVRQAPGKGLEWVSAITWNSGHIDYADSVEGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAKVSYLSTASSLDYWGQGTLVTVSS',
    light:
      'DIQMTQSPSSLSASVGDRVTITCRASQGIRNYLAWYQQKPGKAPKLLIYAASTLQSGVPSRFSGSGSGTDFTLTISSLQPEDVATYYCQRYNRAPYTFGQGTKVEIK',
  },
];

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

  // Build CDR highlights for the viewer
  const cdrHighlights: PocketHighlight[] = result
    ? result.cdr_regions.map((cdr, i) => ({
        rank: i + 1,
        residues: cdr.residues.map((r) => `${cdr.chain}_${r}`),
        selected: cdr.name === 'H3',
        color: CDR_COLORS[cdr.name],
      }))
    : [];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Antibody Structure Prediction
          </h1>
          <p className="mt-1 text-sm text-muted">Powered by ImmuneBuilder</p>
        </div>

        {/* Preset chips */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Sequence inputs */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Heavy Chain (VH)
            </label>
            <textarea
              value={heavy}
              onChange={(e) => setHeavy(e.target.value)}
              rows={6}
              placeholder="Paste heavy chain sequence..."
              className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-muted">
              {heavy.replace(/\s/g, '').length} amino acids
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Light Chain (VL)
            </label>
            <textarea
              value={light}
              onChange={(e) => setLight(e.target.value)}
              rows={6}
              placeholder="Paste light chain sequence..."
              className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-muted">
              {light.replace(/\s/g, '').length} amino acids
            </p>
          </div>
        </div>

        {/* Predict button */}
        <button
          onClick={handlePredict}
          disabled={loading || !heavy.trim() || !light.trim()}
          className="mb-6 w-full rounded-lg bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Predicting… 30-60 seconds on first run
            </span>
          ) : (
            'Predict structure'
          )}
        </button>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* 3D Viewer with CDR highlights */}
            <div className="mb-6">
              <StructureViewer
                structureUrl={`${API_BASE}${result.pdb_url}`}
                height="500px"
                pocketHighlights={cdrHighlights}
              />
            </div>

            {/* CDR table */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                CDR Regions (Chothia)
              </h2>
              <span className="text-sm text-muted">
                Heavy: {result.heavy_length} aa · Light: {result.light_length} aa
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Chain</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Residues</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Length</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Color</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cdr_regions.map((cdr) => {
                    const isH3 = cdr.name === 'H3';
                    return (
                      <tr
                        key={cdr.name}
                        className={`border-b border-border last:border-0 ${
                          isH3 ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              isH3 ? 'text-red-400' : 'text-foreground'
                            }`}
                          >
                            {cdr.name}
                            {isH3 && (
                              <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs">
                                key region
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {cdr.chain === 'H' ? 'Heavy' : 'Light'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {cdr.residues[0]}–{cdr.residues[cdr.residues.length - 1]}
                        </td>
                        <td className="px-4 py-3 text-foreground">{cdr.length}</td>
                        <td className="px-4 py-3">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: CDR_COLORS[cdr.name] || '#64748b' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
