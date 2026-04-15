'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import AssistantProvider from '@/components/AssistantContext';
import AssistantDrawer from '@/components/AssistantDrawer';
import AssistantTrigger from '@/components/AssistantTrigger';

/* ── Sidebar nav items ───────────────────────────────────── */
interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  match?: string; // pathname prefix for active state
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Core',
    items: [
      {
        label: 'Dashboard',
        href: '/app/dashboard',
        match: '/app/dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="6" height="6" rx="1" />
            <rect x="10" y="2" width="6" height="6" rx="1" />
            <rect x="2" y="10" width="6" height="6" rx="1" />
            <rect x="10" y="10" width="6" height="6" rx="1" />
          </svg>
        ),
      },
      {
        label: 'Targets',
        href: '/app/dashboard',
        match: '/app/target',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="7" />
            <circle cx="9" cy="9" r="4" />
            <circle cx="9" cy="9" r="1" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Predict',
    items: [
      {
        label: 'Antibody',
        href: '/app/antibody',
        match: '/app/antibody',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2v4M9 6l-3 3M9 6l3 3M6 9v4M12 9v4M6 13l-2 3M12 13l2 3" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Analyze',
    items: [
      {
        label: 'Analytics',
        href: '/app/analytics',
        match: '/app/analytics',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16h14" />
            <rect x="3" y="10" width="2" height="6" rx="0.5" />
            <rect x="7" y="6" width="2" height="10" rx="0.5" />
            <rect x="11" y="3" width="2" height="13" rx="0.5" />
          </svg>
        ),
      },
    ],
  },
];

/* ── Logo icon ───────────────────────────────────────────── */
function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L24.39 8V20L14 26L3.61 20V8L14 2Z" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="14" cy="14" r="3" fill="#10b981" />
    </svg>
  );
}

/* ── Breadcrumb ──────────────────────────────────────────── */
function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // /app/target/P00533/pocket/1 → ["app","target","P00533","pocket","1"]
  const crumbs: { label: string; href?: string }[] = [];

  if (segments[1] === 'dashboard') {
    crumbs.push({ label: 'Dashboard' });
  } else if (segments[1] === 'antibody') {
    crumbs.push({ label: 'Antibody' });
  } else if (segments[1] === 'analytics') {
    crumbs.push({ label: 'Analytics' });
  } else if (segments[1] === 'target' && segments[2]) {
    crumbs.push({ label: segments[2], href: `/app/target/${segments[2]}` });
    if (segments[3] === 'pocket' && segments[4]) {
      crumbs.push({ label: `Pocket ${segments[4]}` });
    } else if (segments[3] === 'compare') {
      crumbs.push({ label: 'Compare' });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-2">/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="text-muted hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */
const SIDEBAR_KEY = 'opendde-sidebar-collapsed';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  // Persist collapsed state
  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  }

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function isActive(match?: string) {
    if (!match) return false;
    return pathname === match || pathname.startsWith(match + '/');
  }

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex h-full flex-col">
        {/* Logo area */}
        <div className={`flex h-12 shrink-0 items-center border-b border-[var(--border)] ${collapsed ? 'justify-center px-2' : 'gap-2 px-4'}`}>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={onNavigate}>
            <LogoIcon />
            {!collapsed && <span className="text-sm font-bold text-[var(--accent)]">OpenDDE</span>}
          </Link>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-3">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <div className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => {
                  const active = isActive(item.match);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 rounded-lg transition-colors ${
                        collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
                      } ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                          : 'text-muted hover:text-foreground hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className={active ? 'text-emerald-400' : ''}>{item.icon}</span>
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: collapse toggle */}
        <div className="shrink-0 border-t border-[var(--border)] p-2">
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted hover:text-foreground hover:bg-[var(--surface-hover)] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
            >
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <AssistantProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        {/* ── Desktop sidebar ──────────────────────── */}
        <aside
          className={`hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--bg)] transition-[width] duration-200 ${
            collapsed ? 'w-14' : 'w-60'
          }`}
        >
          <SidebarContent />
        </aside>

        {/* ── Mobile sidebar overlay ───────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-60 border-r border-[var(--border)] bg-[var(--bg)] md:hidden"
              >
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main area ────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar — 48px */}
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-md p-1 text-muted hover:text-foreground"
              aria-label="Open sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </button>

            {/* Breadcrumbs */}
            <Breadcrumbs />

            <div className="flex-1" />

            {/* Search trigger */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1 text-xs text-muted hover:text-foreground hover:border-[var(--border-hover)] transition-colors"
            >
              Search
              <kbd className="rounded border border-[var(--kbd-border)] bg-[var(--kbd-bg)] px-1 py-0.5 text-[10px] text-muted-2">⌘K</kbd>
            </button>

            <ThemeToggle />
          </header>

          {/* Page content — fills remaining space */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      <AssistantDrawer />
      <AssistantTrigger />
    </AssistantProvider>
  );
}
