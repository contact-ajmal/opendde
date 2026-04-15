'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Prediction {
  prediction_id: string;
  uniprot_id: string;
  ligand_name: string | null;
  ligand_smiles: string | null;
  status: string;
  structure_url: string | null;
  created_at: string;
}

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POCKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 11,
  padding: '6px 10px',
};

export default function ComparePage() {
  const params = useParams<{ uniprotId: string }>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    apiGet(`/target/${params.uniprotId}/predictions`)
      .then((d) => setPredictions(d.predictions || []))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, [params.uniprotId]);

  const viewingPrediction = predictions.find((p) => p.prediction_id === viewingId);
  const completed = useMemo(
    () => predictions.filter((p) => p.status === 'complete'),
    [predictions],
  );

  const chartData = completed.map((p, i) => ({
    name: p.ligand_name || p.prediction_id.slice(0, 8),
    index: i + 1,
  }));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Compact header */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
        <Link
          href={`/app/target/${params.uniprotId}`}
          className="flex items-center gap-1 text-[11px] text-muted-2 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {params.uniprotId}
        </Link>
        <div className="h-3 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold text-foreground">Compare ligand predictions</h1>
        <span className="ml-auto text-[11px] text-muted-2 tabular-nums">
          {predictions.length} total · {completed.length} complete
        </span>
      </header>

      {/* Body */}
      {predictions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <BarChart3 className="h-8 w-8 text-muted-2" />
          <p className="text-sm text-foreground">No predictions yet</p>
          <p className="text-xs text-muted-2">Run a pocket prediction to see comparisons.</p>
          <Link
            href={`/app/target/${params.uniprotId}`}
            className="mt-1 flex h-7 items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            View pockets
          </Link>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Left: table (60%) */}
          <section className="flex w-3/5 min-w-0 flex-col border-r border-[var(--border)]">
            <div className="flex h-7 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Predictions
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">Ligand</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">SMILES</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">Status</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => {
                    const isViewing = viewingId === pred.prediction_id;
                    return (
                      <tr
                        key={pred.prediction_id}
                        className={`border-b border-[var(--border)] last:border-0 transition-colors ${
                          isViewing ? 'bg-emerald-500/5' : 'hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <td className="px-3 py-1.5">
                          <div className="font-medium text-foreground">
                            {pred.ligand_name || 'Unknown'}
                          </div>
                          <div className="font-mono text-[9px] text-muted-2">
                            {pred.prediction_id.slice(0, 12)}
                          </div>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-1.5 font-mono text-[10px] text-muted-2">
                          {pred.ligand_smiles || '—'}
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                              pred.status === 'complete'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {pred.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {pred.status === 'complete' && pred.structure_url ? (
                            <button
                              onClick={() =>
                                setViewingId(isViewing ? null : pred.prediction_id)
                              }
                              className={`h-6 rounded border px-2 text-[10px] font-medium transition-colors ${
                                isViewing
                                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                                  : 'border-[var(--border)] bg-[var(--bg)] text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400'
                              }`}
                            >
                              {isViewing ? 'Hide 3D' : 'View 3D'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-2">Awaiting</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right: chart on top, 3D viewer bottom (40%) */}
          <section className="flex w-2/5 min-w-0 flex-col bg-[var(--surface)]">
            {/* Chart */}
            <div className="flex h-[200px] shrink-0 flex-col border-b border-[var(--border)]">
              <div className="flex h-7 shrink-0 items-center border-b border-[var(--border)] px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                  Completed predictions
                </span>
              </div>
              <div className="flex-1 p-2">
                {completed.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
                        axisLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-hover)' }} />
                      <Bar dataKey="index" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={POCKET_COLORS[i % POCKET_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-muted-2">
                    Need ≥ 2 completed predictions to compare
                  </div>
                )}
              </div>
            </div>

            {/* 3D viewer */}
            <div className="flex flex-1 flex-col">
              <div className="flex h-7 shrink-0 items-center border-b border-[var(--border)] px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                  3D viewer
                </span>
                {viewingPrediction && (
                  <span className="ml-2 truncate text-[10px] text-muted">
                    {viewingPrediction.ligand_name || 'Complex'}
                  </span>
                )}
              </div>
              <div className="flex-1 bg-black">
                {viewingPrediction?.structure_url ? (
                  <StructureViewer
                    structureUrl={`${API_BASE}${viewingPrediction.structure_url}`}
                    height="100%"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-muted-2">
                    Click &ldquo;View 3D&rdquo; on a completed prediction
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
