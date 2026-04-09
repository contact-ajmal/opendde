'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search, X, Menu } from 'lucide-react';

// ── Sidebar navigation structure ────────────────────────────
interface NavItem {
  title: string;
  href: string;
  keywords?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Getting started',
    items: [
      { title: 'Introduction', href: '/docs', keywords: ['welcome', 'overview', 'what is opendde'] },
      { title: 'Quick start', href: '/docs/quick-start', keywords: ['install', 'setup', 'docker compose', 'clone'] },
      { title: 'System requirements', href: '/docs/system-requirements', keywords: ['hardware', 'ram', 'cpu', 'os'] },
      { title: 'Docker setup', href: '/docs/docker-setup', keywords: ['container', 'docker desktop', 'compose', 'build'] },
    ],
  },
  {
    title: 'Features',
    items: [
      { title: 'Pocket discovery', href: '/docs/pocket-discovery', keywords: ['p2rank', 'binding site', 'druggability'] },
      { title: 'Ligand intelligence', href: '/docs/ligand-intelligence', keywords: ['chembl', 'bioactivity', 'ic50', 'compounds'] },
      { title: 'Complex prediction', href: '/docs/complex-prediction', keywords: ['alphafold', 'docking', 'binding pose'] },
      { title: 'Antibody modeling', href: '/docs/antibody-modeling', keywords: ['immunebuilder', 'cdr', 'heavy chain', 'light chain'] },
      { title: 'AI assistant', href: '/docs/ai-assistant', keywords: ['claude', 'chat', 'analysis', 'reasoning'] },
      { title: 'Druglikeness scoring', href: '/docs/druglikeness-scoring', keywords: ['lipinski', 'veber', 'molecular properties'] },
      { title: 'Druggability reports', href: '/docs/druggability-reports', keywords: ['pdf', 'report', 'assessment'] },
      { title: 'SAR analysis', href: '/docs/sar-analysis', keywords: ['structure activity', 'cliffs', 'similarity'] },
    ],
  },
  {
    title: 'Architecture',
    items: [
      { title: 'System overview', href: '/docs/system-overview', keywords: ['diagram', 'services', 'containers'] },
      { title: 'Engine swap layer', href: '/docs/engine-swap', keywords: ['adapter', 'boltz', 'swap', 'modular'] },
      { title: 'Microservices', href: '/docs/microservices', keywords: ['p2rank', 'rdkit', 'immunebuilder', 'service'] },
      { title: 'Database schema', href: '/docs/database-schema', keywords: ['supabase', 'postgres', 'tables', 'sql'] },
      { title: 'API reference', href: '/docs/api-reference', keywords: ['endpoint', 'rest', 'curl', 'json'] },
    ],
  },
  {
    title: 'Contributing',
    items: [
      { title: 'Development setup', href: '/docs/development-setup', keywords: ['dev', 'local', 'hot reload'] },
      { title: 'Adding new engines', href: '/docs/adding-engines', keywords: ['adapter', 'integrate', 'new tool'] },
      { title: 'Code structure', href: '/docs/code-structure', keywords: ['folders', 'files', 'organization'] },
      { title: 'Pull request guide', href: '/docs/pull-request-guide', keywords: ['pr', 'review', 'contributing'] },
    ],
  },
];

// ── Sidebar component ───────────────────────────────────────
function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return navSections;
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.keywords?.some((k) => k.includes(q)),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <nav className="flex h-full flex-col">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-[var(--bg)] p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-2 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {filteredSections.map((section) => {
          const isCollapsed = collapsed[section.title] && !searchQuery;
          return (
            <div key={section.title} className="mt-4">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-2 hover:text-foreground transition-colors"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                />
                {section.title}
              </button>
              {!isCollapsed && (
                <ul className="mt-1.5 space-y-0.5 border-l border-[var(--border)] ml-1.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={`block rounded-r-md py-1.5 pl-4 pr-2 text-sm transition-colors ${
                            isActive
                              ? 'border-l-2 border-emerald-500 bg-emerald-500/10 font-medium text-emerald-400 -ml-px'
                              : 'text-muted hover:text-foreground hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {filteredSections.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-2">No pages found</p>
        )}
      </div>
    </nav>
  );
}

// ── Docs layout ─────────────────────────────────────────────
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pathname = usePathname();
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Thin docs sub-header */}
      <div className="sticky top-14 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center gap-3 px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-1 text-muted hover:text-foreground lg:hidden"
            aria-label="Open docs menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="rounded-md bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-medium text-muted">
            Documentation
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-[var(--border)]">
          <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--bg)] shadow-xl lg:hidden">
              <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
                <span className="text-sm font-semibold text-foreground">Documentation</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-md p-1.5 text-muted hover:text-foreground"
                  aria-label="Close docs menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </aside>
          </>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-12">
          <div className="docs-content mx-auto max-w-[720px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
