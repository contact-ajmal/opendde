'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Link2, Check } from 'lucide-react';

// ── Article metadata registry ───────────────────────────────
export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  icon: string;
}

export const articles: ArticleMeta[] = [
  { slug: '/learn/drug-discovery-101', title: 'Drug discovery 101', description: 'The complete beginner\'s guide to how drugs are made', readTime: '10 min read', icon: '💊' },
  { slug: '/learn/how-opendde-works', title: 'How OpenDDE works', description: 'Technical overview of every feature', readTime: '8 min read', icon: '🔬' },
  { slug: '/learn/understanding-proteins', title: 'Understanding proteins', description: 'A visual guide to protein structure', readTime: '6 min read', icon: '🧬' },
  { slug: '/learn/target-to-drug', title: 'From target to drug', description: 'A complete EGFR walkthrough', readTime: '12 min read', icon: '🎯' },
];

// ── Reading progress bar ────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--border)]">
      <div
        className="h-full bg-emerald-500 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Table of contents ───────────────────────────────────────
interface TocItem {
  id: string;
  text: string;
  level: number;
}

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="space-y-1">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-2">
        On this page
      </div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`block rounded-md py-1 text-sm transition-colors ${
            item.level === 3 ? 'pl-4' : 'pl-0'
          } ${
            activeId === item.id
              ? 'font-medium text-emerald-400'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}

// ── Share button ────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copyLink}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-[var(--border-hover)] transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}

// ── Layout ──────────────────────────────────────────────────
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHub = pathname === '/learn';
  const contentRef = useRef<HTMLDivElement>(null);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);

  // Extract TOC from rendered headings
  useEffect(() => {
    if (isHub) { setTocItems([]); return; }

    // Small delay to let content render
    const timeout = setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      const headings = el.querySelectorAll('h2[id], h3[id]');
      const items: TocItem[] = [];
      headings.forEach((h) => {
        items.push({
          id: h.id,
          text: h.textContent || '',
          level: h.tagName === 'H3' ? 3 : 2,
        });
      });
      setTocItems(items);
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname, isHub]);

  // Find current + next article
  const currentIndex = articles.findIndex((a) => a.slug === pathname);
  const currentArticle = currentIndex >= 0 ? articles[currentIndex] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  // Hub page gets a simple layout
  if (isHub) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <ReadingProgress />
        {children}
      </div>
    );
  }

  // Article page layout
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ReadingProgress />

      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4">
          <Link href="/learn" className="text-sm text-muted hover:text-foreground transition-colors">
            &larr; All articles
          </Link>
          <div className="flex-1" />
          {currentArticle && (
            <span className="hidden sm:block text-xs text-muted-2">{currentArticle.readTime}</span>
          )}
          <ShareButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] gap-8 px-4">
        {/* Main content */}
        <main className="min-w-0 flex-1 py-10">
          <div ref={contentRef} className="learn-content mx-auto max-w-[680px]">
            {children}

            {/* Next article */}
            {nextArticle && (
              <div className="mt-16 border-t border-[var(--border)] pt-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-2">Next article</p>
                <Link
                  href={nextArticle.slug}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-hover)] transition-colors"
                >
                  <span className="text-2xl">{nextArticle.icon}</span>
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                      {nextArticle.title} &rarr;
                    </div>
                    <div className="text-sm text-muted">{nextArticle.description}</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </main>

        {/* Desktop TOC sidebar */}
        {tocItems.length > 0 && (
          <aside className="hidden xl:block w-56 shrink-0 py-10">
            <div className="sticky top-20">
              <TableOfContents items={tocItems} />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile TOC */}
      {tocItems.length > 0 && (
        <div className="xl:hidden sticky top-14 z-30 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md px-4">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="flex w-full items-center gap-2 py-2.5 text-xs font-medium text-muted"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
            On this page
          </button>
          {tocOpen && (
            <div className="pb-3" onClick={() => setTocOpen(false)}>
              <TableOfContents items={tocItems} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
