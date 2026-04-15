'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { POPULAR_TARGET_CATEGORIES } from '@/data/popularTargets';
import { apiPost } from '@/lib/api';

const categories = Object.keys(POPULAR_TARGET_CATEGORIES);

export default function TargetDirectory() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(categories[0]);
  const [loadingGene, setLoadingGene] = useState<string | null>(null);

  const activeTargets = POPULAR_TARGET_CATEGORIES[activeTab as keyof typeof POPULAR_TARGET_CATEGORIES] || [];

  async function handleTargetClick(gene: string) {
    if (loadingGene) return;
    setLoadingGene(gene);
    try {
      const result = await apiPost('/target/resolve', { query: gene });
      router.push(`/app/target/${result.uniprot_id}`);
    } catch {
      setLoadingGene(null);
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Directory Header Tabs */}
      <div className="flex shrink-0 items-center overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-alt)] scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === cat
                ? 'border-b-2 border-emerald-500 text-foreground'
                : 'text-muted-2 hover:bg-[var(--surface-hover)] hover:text-foreground'
            }`}
          >
            {cat} <span className="ml-1 opacity-50">{(POPULAR_TARGET_CATEGORIES[cat as keyof typeof POPULAR_TARGET_CATEGORIES]).length}</span>
          </button>
        ))}
      </div>

      {/* Directory Content Matrix */}
      <div className="p-4 bg-[var(--surface)] max-h-[350px] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {activeTargets.map((t) => (
            <button
              key={t.uniprot_id}
              onClick={() => handleTargetClick(t.gene !== 'Unknown' ? t.gene : t.uniprot_id)}
              disabled={loadingGene !== null}
              className="group relative flex flex-col items-start justify-center rounded-lg border border-[var(--border)] p-3 text-left transition-all hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] hover:shadow-md disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-emerald-400">
                  {t.gene !== 'Unknown' ? t.gene : t.uniprot_id}
                </span>
                {loadingGene === t.gene ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-2" />
                ) : (
                  <ArrowRight className="h-3 w-3 text-muted-2 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                )}
              </div>
              <span className="mt-1 w-full truncate text-[10px] text-muted-2" title={t.desc}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
