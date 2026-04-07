'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '@/lib/api';

interface SimilarTarget {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
  length: number;
  in_opendde?: boolean;
}

interface SimilarTargetsProps {
  uniprotId: string;
}

export default function SimilarTargets({ uniprotId }: SimilarTargetsProps) {
  const [targets, setTargets] = useState<SimilarTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(`/target/${uniprotId}/similar?limit=5`);
        setTargets(data.similar_targets || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uniprotId]);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="shimmer h-10 w-48 rounded-lg mb-3" />
        <div className="shimmer h-32 rounded-lg" />
      </div>
    );
  }

  if (targets.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span>Related Targets</span>
        <span className="rounded-full bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-medium text-muted">
          {targets.length}
        </span>
        <span className="text-sm text-muted">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {targets.map((t, i) => (
                <motion.div
                  key={t.uniprot_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/target/${t.uniprot_id}`}
                    className="group block rounded-lg border border-border bg-surface p-4 hover:border-border-hover hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {t.gene_name && (
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                              {t.gene_name}
                            </span>
                          )}
                          {t.in_opendde && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              Explored
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 text-sm font-medium text-foreground truncate">
                          {t.name}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="italic">{t.organism}</span>
                      <span>{t.length} aa</span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore &rarr;
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
