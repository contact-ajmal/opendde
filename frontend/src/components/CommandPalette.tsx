'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

interface SearchTarget {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
}

interface SearchLigand {
  chembl_id: string;
  name: string;
  target_id: string;
  activity_type: string | null;
  activity_value_nm: number | null;
}

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  category: string;
  icon: string;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentTargets, setRecentTargets] = useState<SearchTarget[]>([]);
  const [searchTargets, setSearchTargets] = useState<SearchTarget[]>([]);
  const [searchLigands, setSearchLigands] = useState<SearchLigand[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global Cmd+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fetch recent targets on open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIdx(0);
    setSearchTargets([]);
    setSearchLigands([]);
    apiGet('/search?q=')
      .then((data: any) => setRecentTargets(data.targets || []))
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSearchTargets([]);
      setSearchLigands([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      apiGet(`/search?q=${encodeURIComponent(q.trim())}`)
        .then((data: any) => {
          setSearchTargets(data.targets || []);
          setSearchLigands(data.ligands || []);
          setSelectedIdx(0);
        })
        .catch(() => {});
    }, 200);
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  // Build results list
  const results: ResultItem[] = [];
  const q = query.trim();

  if (!q) {
    // Show recent targets + quick actions
    for (const t of recentTargets) {
      results.push({
        id: `recent-${t.uniprot_id}`,
        label: `${t.name}${t.gene_name ? ` (${t.gene_name})` : ''}`,
        sublabel: t.uniprot_id,
        category: 'Recent targets',
        icon: '🎯',
        action: () => {
          router.push(`/target/${t.uniprot_id}`);
          setOpen(false);
        },
      });
    }
    results.push({
      id: 'action-antibody',
      label: 'Go to Antibody prediction',
      sublabel: '/antibody',
      category: 'Quick actions',
      icon: '🧬',
      action: () => {
        router.push('/antibody');
        setOpen(false);
      },
    });
    results.push({
      id: 'action-home',
      label: 'Go to Home',
      sublabel: '/',
      category: 'Quick actions',
      icon: '🏠',
      action: () => {
        router.push('/');
        setOpen(false);
      },
    });
  } else {
    // Search results
    for (const t of searchTargets) {
      results.push({
        id: `target-${t.uniprot_id}`,
        label: `${t.name}${t.gene_name ? ` (${t.gene_name})` : ''}`,
        sublabel: `${t.uniprot_id} · ${t.organism}`,
        category: 'Targets',
        icon: '🎯',
        action: () => {
          router.push(`/target/${t.uniprot_id}`);
          setOpen(false);
        },
      });
    }
    for (const l of searchLigands) {
      const actStr = l.activity_value_nm != null ? `${l.activity_type}: ${l.activity_value_nm} nM` : '';
      results.push({
        id: `ligand-${l.chembl_id}-${l.target_id}`,
        label: `${l.name || l.chembl_id}`,
        sublabel: `${l.target_id}${actStr ? ` · ${actStr}` : ''}`,
        category: 'Ligands',
        icon: '💊',
        action: () => {
          router.push(`/target/${l.target_id}`);
          setOpen(false);
        },
      });
    }
    // Always show "search as new target" option
    results.push({
      id: 'search-new',
      label: `Search for '${q}' as a new target`,
      sublabel: 'Resolve via UniProt →',
      category: 'Search',
      icon: '🔍',
      action: () => {
        router.push(`/target/${encodeURIComponent(q)}`);
        setOpen(false);
      },
    });
  }

  // Clamp selected index
  const clampedIdx = Math.min(selectedIdx, results.length - 1);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[clampedIdx]?.action();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Highlight matching text
  function highlight(text: string) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-emerald-400">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  }

  if (!open) return null;

  // Group results by category
  const grouped: { category: string; items: (ResultItem & { globalIdx: number })[] }[] = [];
  let globalIdx = 0;
  for (const item of results) {
    let group = grouped.find((g) => g.category === item.category);
    if (!group) {
      group = { category: item.category, items: [] };
      grouped.push(group);
    }
    group.items.push({ ...item, globalIdx });
    globalIdx++;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
          <span className="text-slate-500">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search targets, ligands, or commands..."
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-slate-500 outline-none"
          />
          <kbd className="rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                {group.category}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    item.globalIdx === clampedIdx
                      ? 'bg-emerald-500/10 text-foreground'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIdx(item.globalIdx)}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {highlight(item.label)}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {highlight(item.sublabel)}
                    </div>
                  </div>
                  {item.globalIdx === clampedIdx && (
                    <span className="text-xs text-slate-500">↵</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No results found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
          <span><kbd className="rounded border border-slate-600 bg-slate-800 px-1 py-0.5">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-slate-600 bg-slate-800 px-1 py-0.5">↵</kbd> select</span>
          <span><kbd className="rounded border border-slate-600 bg-slate-800 px-1 py-0.5">esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
