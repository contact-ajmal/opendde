'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts';
import { ArrowRight, BarChart3 } from 'lucide-react';
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

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 11,
  padding: '6px 10px',
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-16 flex-col justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3">
      <div className="text-xl font-bold tabular-nums text-foreground">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-2">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-7 shrink-0 items-center border-b border-[var(--border)] px-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          {title}
        </span>
      </div>
      <div className="flex-1 p-2">{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/analytics')
      .then((r) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="shimmer h-8 w-40 rounded" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-16 rounded" />)}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer rounded" />)}
        </div>
      </div>
    );
  }

  if (!data || data.overview.targets_explored === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-2" />
          <h2 className="mb-1 text-sm font-semibold text-foreground">No data yet</h2>
          <p className="mb-3 text-xs text-muted">Explore some targets to see analytics.</p>
          <Link href="/app/dashboard" className="text-xs text-emerald-400 hover:underline">
            Go explore targets →
          </Link>
        </div>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
        <BarChart3 className="h-4 w-4 text-emerald-400" />
        <h1 className="text-sm font-semibold text-foreground">Analytics</h1>
        <span className="text-[11px] text-muted-2">Platform-wide statistics</span>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {/* Stat row */}
        <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Targets explored" value={o.targets_explored} />
          <Stat label="Pockets found" value={o.total_pockets} />
          <Stat label="Ligands catalogued" value={o.total_ligands} />
          <Stat label="Predictions completed" value={o.predictions_completed} />
        </div>

        {/* 2×2 chart grid */}
        <div className="grid min-h-0 shrink-0 grid-cols-1 gap-3 md:grid-cols-2">
          <div className="h-[260px]">
            <ChartCard title="Druggability distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.druggability_distribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-hover)' }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {data.druggability_distribution.map((_, i) => (
                      <Cell key={i} fill={DRUGG_COLORS[i] || '#10b981'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="h-[260px]">
            <ChartCard title="Clinical phases">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.clinical_phase_distribution}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    dataKey="count" nameKey="phase"
                    paddingAngle={2}
                  >
                    {data.clinical_phase_distribution.map((entry) => (
                      <Cell key={entry.phase} fill={PHASE_COLORS[entry.phase] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 pb-1">
                {data.clinical_phase_distribution.map((p) => (
                  <div key={p.phase} className="flex items-center gap-1 text-[9px]">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: PHASE_COLORS[p.phase] || '#6b7280' }} />
                    <span className="text-muted">{p.phase}</span>
                    <span className="tabular-nums text-muted-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="h-[260px]">
            <ChartCard title="Activity distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.activity_distribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-hover)' }} />
                  <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="h-[260px]">
            <ChartCard title="Exploration timeline">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} allowDecimals={false} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="targets"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* Top targets table */}
        {data.top_targets.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-7 shrink-0 items-center border-b border-[var(--border)] px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Most explored targets
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">Gene</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">Target</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-2">UniProt</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-2">Pockets</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-2">Ligands</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {data.top_targets.map((t) => (
                    <tr
                      key={t.uniprot_id}
                      className="group border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <td className="px-3 py-1.5">
                        {t.gene_name ? (
                          <span className="font-mono text-[11px] font-semibold text-emerald-400">
                            {t.gene_name}
                          </span>
                        ) : (
                          <span className="text-muted-2">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-foreground truncate max-w-[280px]">{t.name}</td>
                      <td className="px-3 py-1.5 font-mono text-muted">{t.uniprot_id}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">{t.pocket_count}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">{t.ligand_count}</td>
                      <td className="px-2 py-1.5 text-right">
                        <Link
                          href={`/app/target/${t.uniprot_id}`}
                          className="inline-flex opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={`View ${t.name}`}
                        >
                          <ArrowRight className="h-3 w-3 text-emerald-400" />
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
    </div>
  );
}
