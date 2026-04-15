'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Logo ────────────────────────────────────────────────── */
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2L24.39 8V20L14 26L3.61 20V8L14 2Z" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="14" cy="14" r="3" fill="#10b981" />
      <circle cx="14" cy="6" r="1.5" fill="#10b981" opacity="0.6" />
      <circle cx="20" cy="10" r="1.5" fill="#10b981" opacity="0.6" />
      <circle cx="20" cy="18" r="1.5" fill="#10b981" opacity="0.6" />
      <circle cx="14" cy="22" r="1.5" fill="#10b981" opacity="0.6" />
      <circle cx="8" cy="18" r="1.5" fill="#10b981" opacity="0.6" />
      <circle cx="8" cy="10" r="1.5" fill="#10b981" opacity="0.6" />
      <line x1="14" y1="14" x2="14" y2="6" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="14" x2="20" y2="10" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="14" x2="20" y2="18" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="14" x2="14" y2="22" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="14" x2="8" y2="18" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="14" x2="8" y2="10" stroke="#10b981" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/* ── Dropdown types ──────────────────────────────────────── */
interface DropdownItem {
  label: string;
  description: string;
  icon: string;
  href: string;
}

/* ── Platform mega-menu (3-column) ───────────────────────── */
const platformCols = [
  {
    heading: 'Discovery',
    items: [
      { label: 'Pocket Discovery', description: 'Find druggable binding sites with P2Rank', icon: '🎯', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
      { label: 'Ligand Intelligence', description: 'Explore known drugs from ChEMBL', icon: '💊', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
      { label: 'SAR Analysis', description: 'Activity cliffs & structure-activity', icon: '📈', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
    ],
  },
  {
    heading: 'Prediction',
    items: [
      { label: 'Complex Prediction', description: 'Model binding with AlphaFold 3', icon: '🔬', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
      { label: 'Antibody Modeling', description: 'Predict structures with ImmuneBuilder', icon: '🧬', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/antibody` },
      { label: 'Druglikeness Scoring', description: 'Lipinski & molecular properties', icon: '⚗️', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
    ],
  },
  {
    heading: 'Intelligence',
    items: [
      { label: 'AI Assistant', description: 'Claude-powered drug design insights', icon: '✨', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
      { label: 'Analytics', description: 'Platform-wide data insights', icon: '📊', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/analytics` },
      { label: 'Druggability Reports', description: 'JSON & PDF target assessment', icon: '📋', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
    ],
  },
];

/* ── Learn dropdown (2-column) ───────────────────────────── */
const learnCols = [
  {
    heading: 'Guides',
    items: [
      { label: 'Drug Discovery 101', description: 'Beginner\'s guide to finding medicines', icon: '💊', href: '/learn/drug-discovery-101' },
      { label: 'How OpenDDE Works', description: 'Technical overview of every feature', icon: '🔬', href: '/learn/how-opendde-works' },
    ],
  },
  {
    heading: 'Deep dives',
    items: [
      { label: 'Understanding Proteins', description: 'Visual guide to protein structure', icon: '🧬', href: '/learn/understanding-proteins' },
      { label: 'From Target to Drug', description: 'Complete EGFR walkthrough', icon: '🎯', href: '/learn/target-to-drug' },
    ],
  },
];

/* ── Mega dropdown component ─────────────────────────────── */
function MegaDropdown({
  columns,
  open,
}: {
  columns: { heading: string; items: DropdownItem[] }[];
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl backdrop-blur-xl"
          style={{ width: columns.length === 3 ? '640px' : '440px' }}
        >
          <div className={`grid gap-4 ${columns.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {columns.map((col) => (
              <div key={col.heading}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                  {col.heading}
                </div>
                <div className="space-y-0.5">
                  {col.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <span className="mt-0.5 text-sm">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground leading-snug">{item.label}</div>
                        <div className="text-[11px] text-muted leading-snug">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Mobile flat list helpers ────────────────────────────── */
const allPlatformItems = platformCols.flatMap((c) => c.items);
const allLearnItems = learnCols.flatMap((c) => c.items);

/* ── Navbar ──────────────────────────────────────────────── */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [pathname]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpenDropdown(null); setMobileOpen(false); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav
        className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled
            ? 'border-[var(--border)] bg-[var(--nav-bg)]/80 backdrop-blur-xl shadow-sm'
            : 'border-transparent bg-[var(--nav-bg)]'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
            <span className="text-lg font-bold text-[var(--accent)]">OpenDDE</span>
          </Link>

          {/* Center: Dropdowns */}
          <div ref={dropdownRef} className="hidden md:flex items-center gap-1">
            {/* Platform */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('platform')}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                  openDropdown === 'platform' ? 'text-foreground bg-[var(--surface-hover)]' : 'text-muted hover:text-foreground'
                }`}
              >
                Platform
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}>
                  <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <MegaDropdown columns={platformCols} open={openDropdown === 'platform'} />
            </div>

            {/* Learn */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('learn')}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                  openDropdown === 'learn' ? 'text-foreground bg-[var(--surface-hover)]' : 'text-muted hover:text-foreground'
                }`}
              >
                Learn
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${openDropdown === 'learn' ? 'rotate-180' : ''}`}>
                  <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <MegaDropdown columns={learnCols} open={openDropdown === 'learn'} />
            </div>

            {/* Docs link */}
            <Link
              href="/docs"
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname.startsWith('/docs') ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'
              }`}
            >
              Docs
            </Link>

            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Right: Theme + CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard`}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all"
            >
              Launch app
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden rounded-lg p-2 text-muted hover:text-foreground hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <><path d="M5 5l10 10" /><path d="M15 5L5 15" /></>
                ) : (
                  <><path d="M3 6h14" /><path d="M3 10h14" /><path d="M3 14h14" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-out ──────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-72 border-l border-[var(--border)] bg-[var(--bg)] p-6 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-bold text-[var(--accent)]">OpenDDE</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded p-1 text-muted hover:text-foreground">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <div className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-2">Platform</div>
                {allPlatformItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <div className="pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-muted-2">Learn</div>
                {allLearnItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <Link
                  href="/docs"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span>📚</span>
                  Documentation
                </Link>

                <div className="pt-4">
                  <Link
                    href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard`}
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
                  >
                    Launch app
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Page content ─────────────────────────────── */}
      <div className="pt-14">
        {children}
      </div>
    </>
  );
}
