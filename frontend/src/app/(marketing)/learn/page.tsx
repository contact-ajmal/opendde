import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

export const metadata = {
  title: 'Learn Drug Design',
  description: 'Educational guides on drug discovery, protein structure, computational drug design, and how to use OpenDDE.',
};

interface ArticleCard {
  slug: string;
  title: string;
  shortDescription: string;
  readTime: string;
  tag: string;
  accent: string;
}

const articleCards: ArticleCard[] = [
  {
    slug: '/learn/drug-discovery-101',
    title: 'Drug discovery 101',
    shortDescription: 'How new medicines are found, from target to FDA approval.',
    readTime: '10 min',
    tag: 'Beginner',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    slug: '/learn/how-opendde-works',
    title: 'How OpenDDE works',
    shortDescription: 'Technical overview of every feature in the platform.',
    readTime: '8 min',
    tag: 'Platform',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    slug: '/learn/understanding-proteins',
    title: 'Understanding proteins',
    shortDescription: 'From amino acid sequence to 3D fold — a visual guide.',
    readTime: '6 min',
    tag: 'Biology',
    accent: 'from-purple-500/20 to-purple-500/5',
  },
  {
    slug: '/learn/target-to-drug',
    title: 'From target to drug',
    shortDescription: 'A complete EGFR walkthrough, step by step.',
    readTime: '12 min',
    tag: 'Walkthrough',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
];

export default function LearnHubPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10">
      {/* Compact header */}
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
          <BookOpen className="h-3 w-3" />
          Learn
        </div>
        <h1 className="text-2xl font-bold text-foreground">Learn drug design</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Short guides on the science and tooling behind OpenDDE.
        </p>
      </header>

      {/* Compact 3-col article grid */}
      <section>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Articles
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articleCards.map((article) => (
            <Link
              key={article.slug}
              href={article.slug}
              className="group flex h-[200px] flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-emerald-500/40"
            >
              {/* Thumbnail area */}
              <div className={`relative flex h-20 shrink-0 items-center justify-center bg-gradient-to-br ${article.accent} border-b border-[var(--border)]`}>
                <span className="absolute left-2 top-2 rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted backdrop-blur-sm">
                  {article.tag}
                </span>
                <BookOpen className="h-7 w-7 text-foreground/40" />
              </div>
              {/* Body */}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-[13px] font-semibold leading-snug text-foreground group-hover:text-emerald-400 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                  {article.shortDescription}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-2">
                    <Clock className="h-2.5 w-2.5" />
                    {article.readTime}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Slim CTA footer */}
      <section className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Ready to try it yourself?</h2>
            <p className="text-[11px] text-muted-2">Launch OpenDDE and explore a real target.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/app/dashboard"
              className="flex h-7 items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Launch app
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/docs/quick-start"
              className="flex h-7 items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-medium text-foreground hover:border-[var(--border-hover)] transition-colors"
            >
              Quick start
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
