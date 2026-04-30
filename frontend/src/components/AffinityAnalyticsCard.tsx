'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface AffinityAnalytics {
  total: number;
  status_breakdown: Record<string, number>;
  avg_runtime_seconds: number | null;
  top_targets: { uniprot_id: string; prediction_count: number }[];
  recent_campaigns: {
    id: string;
    uniprot_id: string;
    name: string | null;
    total_ligands: number;
    completed_count: number;
    failed_count: number;
    created_at: string;
    completed_at: string | null;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  complete: 'text-emerald-400',
  running: 'text-blue-400',
  queued: 'text-slate-400',
  failed: 'text-red-400',
  expired: 'text-amber-400',
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

export default function AffinityAnalyticsCard() {
  const [data, setData] = useState<AffinityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/analytics/affinity')
      .then((r) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="shimmer h-40 rounded-md" />;
  if (!data || data.total === 0) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          <FlaskConical className="h-3 w-3 text-blue-400" />
          Affinity predictions
        </div>
        <p className="text-[11px] text-muted-2">
          No affinity predictions yet.{' '}
          <Link href="/app/screen" className="text-blue-300 hover:underline">
            Run a screen
          </Link>
          {' '}to populate this card.
        </p>
      </div>
    );
  }

  const statusEntries = Object.entries(data.status_breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          <FlaskConical className="h-3 w-3 text-blue-400" />
          Affinity predictions
        </span>
        <Link href="/app/screen" className="text-[10px] text-blue-300 hover:underline">
          New screen →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3">
        <div>
          <div className="text-[18px] font-semibold tabular-nums text-foreground">{data.total}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-2">Total predictions</div>
        </div>
        <div>
          <div className="text-[18px] font-semibold tabular-nums text-foreground">
            {formatDuration(data.avg_runtime_seconds)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-2">
            Avg runtime / job
          </div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-2 mb-1">By status</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${STATUS_COLORS[status] || 'text-muted'}`} />
                <span className="text-muted">{status}</span>
                <span className="text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.top_targets.length > 0 && (
        <div className="border-t border-[var(--border)] px-3 py-2">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-2">
            Most-predicted targets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.top_targets.map((t) => (
              <Link
                key={t.uniprot_id}
                href={`/app/target/${t.uniprot_id}`}
                className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] text-foreground hover:bg-[var(--surface-hover)]"
              >
                {t.uniprot_id}
                <span className="ml-1.5 text-muted-2 tabular-nums">{t.prediction_count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.recent_campaigns.length > 0 && (
        <div className="border-t border-[var(--border)]">
          <div className="px-3 pt-2 text-[10px] uppercase tracking-widest text-muted-2">
            Recent campaigns
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-muted-2">
                <th className="px-3 py-1 text-left">Name</th>
                <th className="px-3 py-1 text-left">Target</th>
                <th className="px-3 py-1 text-right">Progress</th>
                <th className="px-3 py-1 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_campaigns.map((c) => {
                const done = c.completed_count + c.failed_count;
                const live = !c.completed_at;
                return (
                  <tr key={c.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-1 text-foreground truncate max-w-[180px]">
                      <Link
                        href={`/app/screen/results/${c.id}`}
                        className="hover:text-blue-300"
                      >
                        {c.name || 'Screen'}
                      </Link>
                    </td>
                    <td className="px-3 py-1 font-mono text-muted">{c.uniprot_id}</td>
                    <td className="px-3 py-1 text-right tabular-nums text-foreground">
                      {done}/{c.total_ligands}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                          live
                            ? 'bg-blue-500/20 text-blue-300'
                            : c.failed_count > 0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {live ? 'running' : c.failed_count > 0 ? 'partial' : 'done'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
