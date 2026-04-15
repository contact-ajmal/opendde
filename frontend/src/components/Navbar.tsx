'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

// SVG logo component
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2L24.39 8V20L14 26L3.61 20V8L14 2Z"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
      />
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

interface DropdownItem {
  label: string;
  description: string;
  icon: string;
  href: string;
}

const platformItems: DropdownItem[] = [
  { label: 'Pocket Discovery', description: 'Find druggable binding sites with P2Rank', icon: '🎯', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
  { label: 'Ligand Intelligence', description: 'Explore known drugs from ChEMBL', icon: '💊', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
  { label: 'Complex Prediction', description: 'Model binding with AlphaFold 3', icon: '🔬', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
  { label: 'Antibody Modeling', description: 'Predict structures with ImmuneBuilder', icon: '🧬', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/antibody` },
  { label: 'AI Assistant', description: 'Claude-powered drug design insights', icon: '✨', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/dashboard` },
  { label: 'Analytics', description: 'Platform-wide data insights', icon: '📊', href: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/analytics` },
];

const learnItems: DropdownItem[] = [
  { label: 'What is Drug Discovery?', description: 'Introduction to computational drug design', icon: '📖', href: '#learn-drug-discovery' },
  { label: 'How OpenDDE Works', description: 'Architecture and workflow overview', icon: '⚙️', href: '#how-it-works' },
  { label: 'Use Cases', description: 'Real examples of target analysis', icon: '🧪', href: '#use-cases' },
];

function Dropdown({ items, open }: { items: DropdownItem[]; open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl"
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span className="mt-0.5 text-base">{item.icon}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted leading-snug">{item.description}</div>
              </div>
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAppPage = pathname.startsWith('/app');

  // Parse breadcrumb from path (for /app/target/... pages)
  const segments = pathname.split('/').filter(Boolean);
  const isTargetPage = segments[0] === 'app' && segments[1] === 'target' && segments[2];
  const uniprotId = isTargetPage ? segments[2] : null;
  const isPocketPage = isTargetPage && segments[3] === 'pocket' && segments[4];
  const pocketRank = isPocketPage ? segments[4] : null;
  const isComparePage = isTargetPage && segments[3] === 'compare';

  // Scroll detection
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
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
      <nav
        className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled
            ? 'border-[var(--border)] bg-[var(--nav-bg)]/80 backdrop-blur-xl shadow-sm'
            : 'border-transparent bg-[var(--nav-bg)]'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo + breadcrumb */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo />
              <span className="text-lg font-bold text-[var(--accent)]">OpenDDE</span>
            </Link>

            {/* App-mode breadcrumb */}
            {isAppPage && uniprotId && (
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted">
                <span className="text-muted-2">/</span>
                <Link
                  href={`/app/target/${uniprotId}`}
                  className="hover:text-foreground transition-colors"
                >
                  {uniprotId}
                </Link>
                {isPocketPage && pocketRank && (
                  <>
                    <span className="text-muted-2">/</span>
                    <span className="text-foreground">Pocket {pocketRank}</span>
                  </>
                )}
                {isComparePage && (
                  <>
                    <span className="text-muted-2">/</span>
                    <span className="text-foreground">Compare</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center: Navigation (marketing mode) */}
          {!isAppPage && (
            <div ref={dropdownRef} className="hidden md:flex items-center gap-1">
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
                <Dropdown items={platformItems} open={openDropdown === 'platform'} />
              </div>

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
                <Dropdown items={learnItems} open={openDropdown === 'learn'} />
              </div>

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
          )}

          {/* Right: App mode controls or CTA */}
          <div className="flex items-center gap-3">
            {isAppPage ? (
              <>
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                  className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1.5 text-xs text-muted hover:text-foreground hover:border-[var(--border-hover)] transition-colors"
                >
                  Search
                  <kbd className="rounded border border-[var(--kbd-border)] bg-[var(--kbd-bg)] px-1 py-0.5 text-[10px] text-muted-2">⌘K</kbd>
                </button>
                <Link
                  href="/app/analytics"
                  className={`hidden sm:block text-sm transition-colors ${
                    pathname.startsWith('/app/analytics')
                      ? 'text-foreground font-medium'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  href="/app/antibody"
                  className={`hidden sm:block text-sm transition-colors ${
                    pathname.startsWith('/app/antibody')
                      ? 'text-foreground font-medium'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Antibody
                </Link>
                <ThemeToggle />
              </>
            ) : (
              <>
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
              </>
            )}

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

      {/* Mobile slide-out menu */}
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
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded p-1 text-muted hover:text-foreground"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <div className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-2">Platform</div>
                {platformItems.map((item) => (
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
                {learnItems.map((item) => (
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
    </>
  );
}
