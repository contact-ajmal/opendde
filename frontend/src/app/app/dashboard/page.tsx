'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crosshair, FlaskConical, Box, ArrowRight, Beaker, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ExampleTargets from '@/components/ExampleTargets';
import AnimatedLayout from '@/components/AnimatedLayout';
import { useCountUp } from '@/hooks/useCountUp';
import { apiGet } from '@/lib/api';

interface StatsData {
  targets_explored: number;
  total_pockets_found: number;
  total_ligands_catalogued: number;
  predictions_completed: number;
  recent_targets: {
    uniprot_id: string;
    name: string;
    gene_name: string | null;
    organism: string;
    resolved_at: string;
  }[];
}

function StatCard({ label, value, delay }: { label: string; value: number; delay: number }) {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="glass-panel p-5"
    >
      <div className="text-2xl font-medium text-foreground">{animated}</div>
      <div className="mt-1 text-[13px] text-muted">{label}</div>
    </motion.div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!stats || stats.targets_explored === 0) {
    return (
      <AnimatedLayout>
        <main className="flex min-h-screen flex-col items-center px-4 py-20">
          <div className="flex flex-col items-center gap-8 text-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Welcome to OpenDDE</h1>
              <p className="mt-2 text-lg text-muted">Start by searching for a drug target</p>
            </div>
            <SearchBar />
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted">Try an example:</p>
              <ExampleTargets />
            </div>
          </div>
        </main>
      </AnimatedLayout>
    );
  }

  return (
    <AnimatedLayout>
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <SearchBar />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Targets explored" value={stats.targets_explored} delay={0} />
            <StatCard label="Pockets found" value={stats.total_pockets_found} delay={0.08} />
            <StatCard label="Ligands catalogued" value={stats.total_ligands_catalogued} delay={0.16} />
            <StatCard label="Predictions completed" value={stats.predictions_completed} delay={0.24} />
          </div>

          {stats.recent_targets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="mb-8"
            >
              <h2 className="mb-4 text-lg font-semibold text-foreground">Recent targets</h2>
              <div className="overflow-hidden rounded-xl border border-border">
                {stats.recent_targets.map((t, i) => (
                  <button
                    key={t.uniprot_id}
                    onClick={() => router.push(`/app/target/${t.uniprot_id}`)}
                    className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--hover-row)] active:scale-[0.995] ${
                      i > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-xs font-bold text-[var(--accent)]">
                      {(t.gene_name || t.uniprot_id).slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{t.name}</span>
                        {t.gene_name && (
                          <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                            {t.gene_name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                        <span>{t.uniprot_id}</span>
                        <span>{t.organism}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-2">{timeAgo(t.resolved_at)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-2 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick actions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/app/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector<HTMLInputElement>('input[placeholder*="UniProt"]')?.focus();
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-[var(--border-hover)] active:scale-[0.97]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Crosshair className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Explore new target</div>
                  <div className="text-xs text-muted">Search by gene or UniProt ID</div>
                </div>
              </Link>

              <Link
                href="/app/antibody"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-[var(--border-hover)] active:scale-[0.97]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                  <Beaker className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Predict antibody</div>
                  <div className="text-xs text-muted">Model with ImmuneBuilder</div>
                </div>
              </Link>

              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-[var(--border-hover)] active:scale-[0.97]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
                  <Download className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Search & export</div>
                  <div className="text-xs text-muted">Cmd+K to search everything</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </AnimatedLayout>
  );
}
