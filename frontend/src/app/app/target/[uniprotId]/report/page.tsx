'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  PieChart, Pie, Legend,
} from 'recharts';
import { ArrowLeft, Download, Share2, FileText, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Report {
  target: {
    name: string;
    uniprot_id: string;
    organism: string;
    length: number;
    gene_name: string | null;
  };
  structure: { source: string; plddt_mean: number | null };
  druggability_assessment: {
    verdict: string;
    score: number;
    reasoning: string;
  };
  pockets: {
    rank: number;
    score: number;
    druggability: number;
    residue_count: number;
    known_ligand_count: number;
  }[];
  ligand_summary: {
    total_known: number;
    approved_drugs: number;
    phase_3: number;
    best_ic50_nm: number | null;
    chemical_series_count: number;
  };
  top_ligands: {
    chembl_id: string;
    name: string;
    smiles: string;
    activity_type: string;
    activity_value_nm: number;
    clinical_phase: number;
    clinical_phase_label: string;
  }[];
  generated_at: string;
}

function verdictColor(verdict: string) {
  if (verdict.includes('Highly')) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30', stroke: '#10b981' };
  if (verdict === 'Druggable') return { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/30', stroke: '#3b82f6' };
  if (verdict.includes('Moderately')) return { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30', stroke: '#f59e0b' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30', stroke: '#ef4444' };
}

function formatActivity(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mM`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} µM`;
  return `${value.toFixed(1)} nM`;
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{(score * 100).toFixed(0)}</span>
        <span className="text-xs text-muted">/ 100</span>
      </div>
    </div>
  );
}

const PHASE_COLORS = ['#6b7280', '#a78bfa', '#f59e0b', '#3b82f6', '#10b981'];

export default function ReportPage() {
  const params = useParams<{ uniprotId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(`/report/${params.uniprotId}`);
        setReport(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.uniprotId]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <FileText className="h-8 w-8 text-muted-2" />
        <h2 className="text-sm font-semibold text-foreground">Report unavailable</h2>
        <p className="text-xs text-muted-2">{error || 'Could not generate report.'}</p>
        <Link
          href={`/app/target/${params.uniprotId}`}
          className="mt-1 flex h-7 items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to target
        </Link>
      </div>
    );
  }

  const vc = verdictColor(report.druggability_assessment.verdict);

  // Phase distribution for pie chart
  const phaseCounts: Record<string, number> = {};
  for (const l of report.top_ligands) {
    const label = l.clinical_phase_label || 'Preclinical';
    phaseCounts[label] = (phaseCounts[label] || 0) + 1;
  }

  // Build full phase distribution from ligand_summary
  const pieData = [];
  const ls = report.ligand_summary;
  const preclinical = ls.total_known - ls.approved_drugs - ls.phase_3;
  if (preclinical > 0) pieData.push({ name: 'Preclinical / Phase 1-2', value: preclinical, color: PHASE_COLORS[0] });
  if (ls.phase_3 > 0) pieData.push({ name: 'Phase 3', value: ls.phase_3, color: PHASE_COLORS[3] });
  if (ls.approved_drugs > 0) pieData.push({ name: 'Approved', value: ls.approved_drugs, color: PHASE_COLORS[4] });

  // Pocket chart data
  const pocketData = report.pockets.map(p => ({
    name: `P${p.rank}`,
    score: p.score,
    druggability: +(p.druggability * 100).toFixed(0),
  }));

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
        <FileText className="h-3.5 w-3.5 text-emerald-400" />
        <h1 className="text-sm font-semibold text-foreground">Target report</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex h-6 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[10px] font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Share2 className="h-3 w-3 text-muted-2" />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <a
            href={`${API_BASE}/api/v1/report/${params.uniprotId}/pdf`}
            className="flex h-6 items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="h-3 w-3" />
            PDF
          </a>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4">
          {/* Header */}
          <div className="mb-4 rounded-lg border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-foreground">{report.target.name}</h1>
                  {report.target.gene_name && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      {report.target.gene_name}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted">
                  {report.target.organism} &middot; {report.target.length} amino acids &middot;{' '}
                  {report.structure.source === 'alphafold_db' ? 'AlphaFold' : report.structure.source}
                  {report.structure.plddt_mean != null && ` · pLDDT ${report.structure.plddt_mean.toFixed(1)}`}
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${vc.bg} ${vc.text} ${vc.ring}`}>
                {report.druggability_assessment.verdict}
              </div>
            </div>
          </div>

          {/* Verdict section */}
          <div className="mb-4 grid gap-3 md:grid-cols-[160px_1fr]">
            <div className="flex justify-center">
              <ScoreGauge
                score={report.druggability_assessment.score}
                color={vc.stroke}
              />
            </div>
            <div className="space-y-3">
              <p className="text-[13px] text-foreground leading-relaxed">
                {report.druggability_assessment.reasoning}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{report.pockets.length}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-2">Pockets</div>
                </div>
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{ls.total_known}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-2">Known ligands</div>
                </div>
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{ls.approved_drugs}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-2">Approved drugs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pocket analysis bar chart */}
          {pocketData.length > 0 && (
            <div className="mb-4 rounded-lg border border-border bg-surface p-3">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Pocket analysis</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pocketData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text)',
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'druggability' ? [`${value}%`, 'Druggability'] : [value.toFixed(1), 'Score']
                    }
                  />
                  <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
                    {pocketData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.druggability >= 70 ? '#10b981' : entry.druggability >= 40 ? '#f59e0b' : '#6b7280'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="druggability" name="Druggability" radius={[4, 4, 0, 0]} fillOpacity={0.5}>
                    {pocketData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.druggability >= 70 ? '#10b981' : entry.druggability >= 40 ? '#f59e0b' : '#6b7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ligand landscape */}
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {/* Donut chart */}
            {pieData.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <h2 className="mb-2 text-sm font-semibold text-foreground">Clinical phase distribution</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      dataKey="value"
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ligand summary stats */}
            <div className="rounded-lg border border-border bg-surface p-3">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Ligand summary</h2>
              <div className="space-y-2">
                {[
                  ['Total known', ls.total_known],
                  ['Approved drugs', ls.approved_drugs],
                  ['Phase 3', ls.phase_3],
                  ['Best IC50', ls.best_ic50_nm ? formatActivity(ls.best_ic50_nm) : 'N/A'],
                  ['Chemical series (est.)', ls.chemical_series_count],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span className="text-sm text-muted">{label}</span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 ligands */}
          {report.top_ligands.length > 0 && (
            <div className="mb-4 rounded-lg border border-border bg-surface p-3">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Top ligands by activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted">Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_ligands.map((l) => (
                      <tr key={l.chembl_id} className="border-b border-border last:border-0 hover:bg-[var(--hover-row)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{l.name}</div>
                          <div className="text-xs text-muted">{l.chembl_id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                            {l.activity_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatActivity(l.activity_value_nm)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            l.clinical_phase >= 4 ? 'bg-emerald-500/20 text-emerald-400' :
                            l.clinical_phase >= 3 ? 'bg-blue-500/20 text-blue-400' :
                            l.clinical_phase >= 2 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-[var(--phase-0-bg)] text-[var(--phase-0-text)]'
                          }`}>
                            {l.clinical_phase_label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted pb-6">
            Generated by OpenDDE — Open Drug Design Engine &middot; {new Date(report.generated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
