'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();

  // Parse breadcrumb from path
  const segments = pathname.split('/').filter(Boolean);
  const isTargetPage = segments[0] === 'target' && segments[1];
  const uniprotId = isTargetPage ? segments[1] : null;
  const isPocketPage = isTargetPage && segments[2] === 'pocket' && segments[3];
  const pocketRank = isPocketPage ? segments[3] : null;
  const isComparePage = isTargetPage && segments[2] === 'compare';

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            OpenDDE
          </Link>

          {/* Breadcrumb */}
          {uniprotId && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <span className="text-muted-2">/</span>
              <Link
                href={`/target/${uniprotId}`}
                className="hover:text-foreground transition-colors"
              >
                {uniprotId}
              </Link>
              {isPocketPage && pocketRank && (
                <>
                  <span className="text-muted-2">›</span>
                  <span className="text-foreground">Pocket {pocketRank}</span>
                </>
              )}
              {isComparePage && (
                <>
                  <span className="text-muted-2">›</span>
                  <span className="text-foreground">Compare</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1.5 text-xs text-muted hover:text-foreground hover:border-[var(--border-hover)] transition-colors"
          >
            Search
            <kbd className="rounded border border-[var(--kbd-border)] bg-[var(--kbd-bg)] px-1 py-0.5 text-[10px] text-muted-2">⌘K</kbd>
          </button>
          <Link
            href="/analytics"
            className={`text-sm transition-colors ${
              pathname === '/analytics'
                ? 'text-foreground font-medium'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Analytics
          </Link>
          <Link
            href="/antibody"
            className={`text-sm transition-colors ${
              pathname === '/antibody'
                ? 'text-foreground font-medium'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Antibody
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
