'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

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
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            OpenDDE
          </Link>

          {/* Breadcrumb */}
          {uniprotId && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <span className="text-slate-600">/</span>
              <Link
                href={`/target/${uniprotId}`}
                className="hover:text-foreground transition-colors"
              >
                {uniprotId}
              </Link>
              {isPocketPage && pocketRank && (
                <>
                  <span className="text-slate-600">›</span>
                  <span className="text-foreground">Pocket {pocketRank}</span>
                </>
              )}
              {isComparePage && (
                <>
                  <span className="text-slate-600">›</span>
                  <span className="text-foreground">Compare</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/antibody"
            className={`text-sm transition-colors ${
              pathname === '/antibody'
                ? 'text-foreground font-medium'
                : 'text-slate-400 hover:text-foreground'
            }`}
          >
            Antibody
          </Link>
        </div>
      </div>
    </nav>
  );
}
