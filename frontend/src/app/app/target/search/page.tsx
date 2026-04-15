'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, Clock, Sparkles, ArrowRight, Loader2, X } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface TargetHit {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
}

interface RecentSearch {
  query: string;
  uniprot_id: string;
  gene_name: string | null;
  timestamp: number;
}

const POPULAR_TARGETS = [
  { gene: 'EGFR', uniprot: 'P00533', disease: 'Non-small cell lung cancer' },
  { gene: 'CDK2', uniprot: 'P24941', disease: 'Cell cycle regulation' },
  { gene: 'BRAF', uniprot: 'P15056', disease: 'Melanoma' },
  { gene: 'ACE2', uniprot: 'Q9BYF1', disease: 'SARS-CoV-2 receptor' },
  { gene: 'BCL2', uniprot: 'P10415', disease: 'Apoptosis regulator' },
  { gene: 'TP53', uniprot: 'P04637', disease: 'Tumor suppressor' },
  { gene: 'JAK2', uniprot: 'O60674', disease: 'Myeloproliferative disorders' },
  { gene: 'HDAC1', uniprot: 'Q13547', disease: 'Epigenetic regulation' },
  { gene: 'MTOR', uniprot: 'P42345', disease: 'Cell growth signaling' },
  { gene: 'PARP1', uniprot: 'P09874', disease: 'DNA damage repair' },
  { gene: 'ABL1', uniprot: 'P00519', disease: 'Chronic myeloid leukemia' },
  { gene: 'ALK', uniprot: 'Q9UM73', disease: 'Lung cancer / neuroblastoma' },
];

const RECENT_KEY = 'opendde-recent-target-searches';
const MAX_RECENT = 6;

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TargetSearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TargetHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    inputRef.current?.focus();
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      apiGet(`/search?q=${encodeURIComponent(query.trim())}`)
        .then((d) => setResults(d.targets || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function pushRecent(hit: TargetHit) {
    const entry: RecentSearch = {
      query,
      uniprot_id: hit.uniprot_id,
      gene_name: hit.gene_name,
      timestamp: Date.now(),
    };
    const next = [entry, ...recent.filter((r) => r.uniprot_id !== hit.uniprot_id)].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function handleExplore(hit: TargetHit) {
    pushRecent(hit);
    router.push(`/app/target/${hit.uniprot_id}`);
  }

  function clearRecents() {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  }

  const showResults = query.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
        <SearchIcon className="h-4 w-4 text-emerald-400" />
        <h1 className="text-sm font-semibold text-foreground">Search protein targets</h1>
        <span className="text-[11px] text-muted-2">UniProt · gene name · protein name</span>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-4">
        {/* Large search bar */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by UniProt ID, gene name, or protein name…"
            className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-emerald-500/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searching && (
            <Loader2 className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-2" />
          )}
        </div>

        {/* Live results */}
        {showResults && (
          <div className="mb-5 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-8 items-center justify-between border-b border-[var(--border)] px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Search results
              </span>
              <span className="text-[10px] text-muted-2 tabular-nums">
                {results.length} match{results.length === 1 ? '' : 'es'}
              </span>
            </div>
            {results.length === 0 && !searching ? (
              <div className="flex h-20 items-center justify-center text-xs text-muted-2">
                No results for &ldquo;{query}&rdquo;. Try a UniProt ID like <span className="ml-1 font-mono">P00533</span>.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {results.map((hit) => (
                  <button
                    key={hit.uniprot_id}
                    onClick={() => handleExplore(hit)}
                    className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {hit.gene_name && (
                          <span className="font-mono text-sm font-semibold text-emerald-400">
                            {hit.gene_name}
                          </span>
                        )}
                        <span className="truncate text-[12px] text-foreground">{hit.name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-2">
                        <span className="font-mono">{hit.uniprot_id}</span>
                        <span>·</span>
                        <span className="italic truncate">{hit.organism}</span>
                      </div>
                    </div>
                    <span className="flex h-7 shrink-0 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] font-medium text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-colors">
                      Explore
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Two columns: recent + popular */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent searches */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-8 items-center justify-between border-b border-[var(--border)] px-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-2" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                  Recent searches
                </span>
              </div>
              {recent.length > 0 && (
                <button
                  onClick={clearRecents}
                  className="text-[10px] text-muted-2 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-2">
                Your recent searches will appear here.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recent.map((r) => (
                  <Link
                    key={`${r.uniprot_id}-${r.timestamp}`}
                    href={`/app/target/${r.uniprot_id}`}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    {r.gene_name && (
                      <span className="font-mono font-semibold text-emerald-400">{r.gene_name}</span>
                    )}
                    <span className="font-mono text-muted">{r.uniprot_id}</span>
                    <span className="ml-auto text-[10px] text-muted-2">{relativeTime(r.timestamp)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Popular targets */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-8 items-center border-b border-[var(--border)] px-3">
              <Sparkles className="mr-1.5 h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                Popular targets
              </span>
              <span className="ml-auto text-[10px] text-muted-2 tabular-nums">
                {POPULAR_TARGETS.length}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {POPULAR_TARGETS.map((t) => (
                <Link
                  key={t.uniprot}
                  href={`/app/target/${t.uniprot}`}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <span className="w-14 font-mono font-semibold text-emerald-400">{t.gene}</span>
                  <span className="flex-1 truncate text-muted">{t.disease}</span>
                  <span className="font-mono text-[10px] text-muted-2">{t.uniprot}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
