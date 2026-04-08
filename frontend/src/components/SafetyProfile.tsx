'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '@/lib/api';

interface SafetyData {
  ensembl_id: string;
  symbol: string;
  tractability: Record<string, string>;
  safety_liabilities: { event: string; direction: string | null; tissue: string | null }[];
  known_drugs_count: number;
  top_disease_associations: { disease: string; score: number }[];
}

interface SafetyProfileProps {
  uniprotId: string;
}

function tractBadge(label: string) {
  const isApproved = label.includes('Approved');
  const isClinical = label.includes('Clinical');
  if (isApproved) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  if (isClinical) return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
  return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
}

const SERIOUS_EVENTS = new Set([
  'cardiomyopathy', 'hepatotoxicity', 'heart disease', 'interstitial lung disease',
  'cardiac arrhythmia', 'renal toxicity', 'nephrotoxicity', 'seizure',
]);

function severityColor(event: string): string {
  const lower = event.toLowerCase();
  for (const s of SERIOUS_EVENTS) {
    if (lower.includes(s)) return 'bg-red-500';
  }
  return 'bg-amber-500';
}

export default function SafetyProfile({ uniprotId }: SafetyProfileProps) {
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet(`/target/${uniprotId}/safety`);
        setData(result);
      } catch {
        // no safety data available
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uniprotId]);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="shimmer h-10 w-56 rounded-lg mb-3" />
        <div className="shimmer h-32 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const tractKeys = Object.keys(data.tractability);

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span>Safety &amp; Tractability</span>
        {data.safety_liabilities.length > 0 && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
            {data.safety_liabilities.length} signals
          </span>
        )}
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
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tractability + Drugs */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Tractability</h4>
                {tractKeys.length > 0 ? (
                  <div className="space-y-2">
                    {tractKeys.map((mod) => {
                      const label = data.tractability[mod];
                      const { bg, text } = tractBadge(label);
                      const modLabel = mod === 'small_molecule' ? 'Small molecule' :
                                       mod === 'antibody' ? 'Antibody' :
                                       mod.charAt(0).toUpperCase() + mod.slice(1);
                      return (
                        <div key={mod} className="flex items-center justify-between">
                          <span className="text-sm text-muted">{modLabel}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No tractability data</p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted">Known drugs &amp; candidates</span>
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                    {data.known_drugs_count}
                  </span>
                </div>
              </div>

              {/* Safety signals */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Safety Signals</h4>
                {data.safety_liabilities.length > 0 ? (
                  <div className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
                    {data.safety_liabilities.map((sl, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${severityColor(sl.event)}`} />
                        <div className="min-w-0">
                          <span className="text-sm text-foreground">{sl.event}</span>
                          {sl.tissue && (
                            <span className="ml-1.5 text-xs text-muted">({sl.tissue})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-400">No known safety liabilities</p>
                )}
              </div>

              {/* Disease associations */}
              {data.top_disease_associations.length > 0 && (
                <div className="rounded-lg border border-border bg-surface p-4 md:col-span-2">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Top Disease Associations</h4>
                  <div className="space-y-2">
                    {data.top_disease_associations.slice(0, 5).map((d, i) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-foreground truncate mr-2">{d.disease}</span>
                          <span className="flex-shrink-0 text-xs text-muted">
                            {(d.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-alt)]">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.max(d.score * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
