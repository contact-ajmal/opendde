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

// ── Onboarding landing page ──────────────────────────────────

const features = [
  { icon: Crosshair, title: 'Pocket discovery', description: 'Identify binding sites with P2Rank' },
  { icon: FlaskConical, title: 'Ligand intelligence', description: 'Known drugs from ChEMBL' },
  { icon: Box, title: 'Complex prediction', description: 'Model binding with AlphaFold 3' },
];

const howItWorks = [
  { icon: Crosshair, title: 'Pocket discovery', detail: 'P2Rank identifies druggable binding sites on your protein structure using machine learning on geometric and physicochemical features.' },
  { icon: FlaskConical, title: 'Ligand intelligence', detail: 'Known drugs and bioactive compounds are fetched from ChEMBL with IC50, Ki, and Kd activity data plus clinical trial status.' },
  { icon: Box, title: 'Complex prediction', detail: 'AlphaFold 3 models protein-ligand interactions to predict how a drug candidate binds to its target pocket.' },
];

function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-20">
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-5xl font-bold text-primary sm:text-6xl">OpenDDE</h1>
          <p className="mt-2 text-lg text-foreground sm:text-xl">Open Drug Design Engine</p>
        </div>

        <p className="max-w-lg text-muted">
          Discover druggable pockets. Explore known ligands. Predict binding complexes.
        </p>

        <SearchBar />

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted">Try an example:</p>
          <ExampleTargets />
        </div>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="font-medium text-foreground">{f.title}</h3>
              <p className="text-sm text-muted">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 w-full max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-foreground">How it works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map((item, i) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {i + 1}
                  </div>
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-16 w-full max-w-4xl border-t border-border pt-8 pb-4">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted">
              OpenDDE — Open Drug Design Engine. Built with AlphaFold 3, P2Rank, and ImmuneBuilder.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="mt-2 text-center text-xs text-muted-2">
            Inspired by Isomorphic Labs&apos; IsoDDE
          </p>
        </footer>
      </div>
    </main>
  );
}

// ── Dashboard page ───────────────────────────────────────────

function DashboardPage({ stats }: { stats: StatsData }) {
  const router = useRouter();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Search */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">OpenDDE</h1>
          <SearchBar />
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Targets explored" value={stats.targets_explored} delay={0} />
          <StatCard label="Pockets found" value={stats.total_pockets_found} delay={0.08} />
          <StatCard label="Ligands catalogued" value={stats.total_ligands_catalogued} delay={0.16} />
          <StatCard label="Predictions completed" value={stats.predictions_completed} delay={0.24} />
        </div>

        {/* Recent targets */}
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
                  onClick={() => router.push(`/target/${t.uniprot_id}`)}
                  className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--hover-row)] active:scale-[0.995] ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  {/* Gene badge */}
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

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/"
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
              href="/antibody"
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
                <div className="text-xs text-muted">⌘K to search everything</div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 pb-4">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted">
              OpenDDE — Open Drug Design Engine. Built with AlphaFold 3, P2Rank, and ImmuneBuilder.
            </p>
            <p className="text-xs text-muted-2">
              Inspired by Isomorphic Labs&apos; IsoDDE
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ── Main page ────────────────────────────────────────────────

export default function Home() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const isReturningUser = stats && stats.targets_explored > 0;

  return (
    <AnimatedLayout>
      {isReturningUser ? <DashboardPage stats={stats} /> : <OnboardingPage />}
    </AnimatedLayout>
  );
}
