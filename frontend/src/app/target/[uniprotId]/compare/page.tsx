'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StructureViewer from '@/components/StructureViewer';
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POCKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

export default function ComparePage() {
  const params = useParams<{ uniprotId: string }>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await apiGet(`/target/${params.uniprotId}/predictions`);
        setPredictions(data.predictions || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [params.uniprotId]);

  const viewingPrediction = predictions.find((p) => p.prediction_id === viewingId);
  const completed = predictions.filter((p) => p.status === 'complete');

  const chartData = completed.map((p, i) => ({
    name: p.ligand_name || p.prediction_id.slice(0, 8),
    index: i,
  }));

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/target/${params.uniprotId}`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to target
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Compare Ligands
          </h1>
        </div>

        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12">
            <p className="text-lg text-muted">No predictions yet.</p>
            <p className="mt-2 text-sm text-muted">
              Go to a pocket detail page to start predicting.
            </p>
            <Link
              href={`/target/${params.uniprotId}`}
              className="mt-4 rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-600"
            >
              View pockets
            </Link>
          </div>
        ) : (
          <>
            {/* Chart for completed predictions */}
            {completed.length >= 2 && (
              <div className="mb-8 rounded-lg border border-border bg-surface p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Completed Predictions
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="index" name="Prediction" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={POCKET_COLORS[i % POCKET_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Predictions table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Ligand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">SMILES</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr
                      key={pred.prediction_id}
                      className="border-b border-border last:border-0 hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">
                          {pred.ligand_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-muted">
                        {pred.ligand_smiles || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            pred.status === 'complete'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {pred.status === 'complete' ? 'Complete' : 'Prepared'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pred.status === 'complete' && pred.structure_url ? (
                          <button
                            onClick={() =>
                              setViewingId(
                                viewingId === pred.prediction_id ? null : pred.prediction_id
                              )
                            }
                            className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30"
                          >
                            {viewingId === pred.prediction_id ? 'Hide 3D' : 'View 3D'}
                          </button>
                        ) : (
                          <span className="text-xs text-muted">Awaiting upload</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3D viewer for selected prediction */}
            {viewingPrediction?.structure_url && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {viewingPrediction.ligand_name || 'Complex'} — 3D Structure
                </h3>
                <StructureViewer
                  structureUrl={`${API_BASE}${viewingPrediction.structure_url}`}
                  height="500px"
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
