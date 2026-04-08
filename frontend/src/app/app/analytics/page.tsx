'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts';
import AnimatedLayout from '@/components/AnimatedLayout';
import { apiGet } from '@/lib/api';

interface Analytics {
  overview: {
    targets_explored: number;
    total_pockets: number;
    total_ligands: number;
    predictions_completed: number;
    antibodies_predicted: number;
  };
  druggability_distribution: { range: string; count: number }[];
  top_targets: {
    name: string;
    gene_name: string | null;
    uniprot_id: string;
    pocket_count: number;
    ligand_count: number;
  }[];
  activity_distribution: { range: string; count: number }[];
  clinical_phase_distribution: { phase: string; count: number }[];
  timeline: { date: string; targets: number; new: number }[];
}

const PHASE_COLORS: Record<string, string> = {
  Approved: '#10b981',
  'Phase III': '#3b82f6',
  'Phase II': '#f59e0b',
  'Phase I': '#a78bfa',
  Preclinical: '#6b7280',
};

const DRUGG_COLORS = ['#6b7280', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

const chartTooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 12,
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/analytics');
        setData(result);
      } catch {
        // will show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="shimmer h-10 w-48 rounded-lg" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-24 rounded-lg" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-64 rounded-lg" />)}
          </div>
        </div>
      </main>
    );
  }

  if (!data || data.overview.targets_explored === 0) {
    return (
      <AnimatedLayout>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">No data yet</h2>
            <p className="text-muted mb-4">Explore some targets to see analytics here.</p>
            <Link href="/app/dashboard" className="text-emerald-400 hover:underline">Go explore targets</Link>
          </div>
        </main>
      </AnimatedLayout>
    );
  }

  const o = data.overview;

  return (
    <AnimatedLayout>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-bold text-foreground">Analytics</h1>

          {/* Metric cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Targets explored" value={o.targets_explored} />
            <MetricCard label="Pockets found" value={o.total_pockets} />
            <MetricCard label="Ligands catalogued" value={o.total_ligands} />
            <MetricCard label="Predictions completed" value={o.predictions_completed} />
          </div>

          {/* Charts row 1 */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Druggability distribution */}
            {data.druggability_distribution.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Druggability Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.druggability_distribution}>
                    <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.druggability_distribution.map((_, i) => (
                        <Cell key={i} fill={DRUGG_COLORS[i] || '#10b981'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Clinical phase distribution */}
            {data.clinical_phase_distribution.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Clinical Phase Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.clinical_phase_distribution}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={85}
                      dataKey="count"
                      nameKey="phase"
                      paddingAngle={2}
                      label={({ phase, count }) => `${phase}: ${count}`}
                    >
                      {data.clinical_phase_distribution.map((entry) => (
                        <Cell key={entry.phase} fill={PHASE_COLORS[entry.phase] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Charts row 2 */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Activity distribution */}
            {data.activity_distribution.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Activity Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.activity_distribution}>
                    <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Timeline */}
            {data.timeline.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Exploration Timeline</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.timeline}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone" dataKey="targets" name="Total targets"
                      stroke="#10b981" fill="#10b981" fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top targets table */}
          {data.top_targets.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Most Explored Targets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Target</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Gene</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted">Pockets</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted">Ligands</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_targets.map((t) => (
                      <tr key={t.uniprot_id} className="border-b border-border last:border-0 hover:bg-[var(--hover-row)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{t.name}</div>
                          <div className="text-xs text-muted">{t.uniprot_id}</div>
                        </td>
                        <td className="px-4 py-3">
                          {t.gene_name && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              {t.gene_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">{t.pocket_count}</td>
                        <td className="px-4 py-3 text-right text-foreground">{t.ligand_count}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/app/target/${t.uniprot_id}`}
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </AnimatedLayout>
  );
}
