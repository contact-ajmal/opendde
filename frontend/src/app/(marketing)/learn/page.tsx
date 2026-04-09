import Link from 'next/link';

export const metadata = {
  title: 'Learn Drug Design',
  description: 'Educational guides on drug discovery, protein structure, computational drug design, and how to use OpenDDE.',
};

const articleCards = [
  {
    slug: '/learn/drug-discovery-101',
    title: 'Drug discovery 101',
    description: 'The complete beginner\'s guide to how new medicines are found, from target identification to FDA approval. No biology background needed.',
    readTime: '10 min read',
    icon: '💊',
    tag: 'Beginner',
  },
  {
    slug: '/learn/how-opendde-works',
    title: 'How OpenDDE works',
    description: 'Technical overview of every feature: pocket detection, ligand intelligence, complex prediction, antibody modeling, and the AI assistant.',
    readTime: '8 min read',
    icon: '🔬',
    tag: 'Platform',
  },
  {
    slug: '/learn/understanding-proteins',
    title: 'Understanding proteins',
    description: 'A visual guide to protein structure: from amino acid sequence to 3D fold. Learn what pLDDT scores mean and how AlphaFold works.',
    readTime: '6 min read',
    icon: '🧬',
    tag: 'Biology',
  },
  {
    slug: '/learn/target-to-drug',
    title: 'From target to drug',
    description: 'A complete walkthrough using EGFR (a real cancer drug target) as an example. Follow along step-by-step in OpenDDE.',
    readTime: '12 min read',
    icon: '🎯',
    tag: 'Walkthrough',
  },
];

const videoTutorials = [
  { title: 'Getting started with OpenDDE', duration: '2:00', description: 'Install, launch, and search your first target' },
  { title: 'Pocket analysis deep dive', duration: '3:15', description: 'Interpret druggability scores and residue composition' },
  { title: 'Ligand table & SAR', duration: '2:45', description: 'Navigate compounds, sort by activity, find cliffs' },
  { title: 'Antibody prediction', duration: '1:30', description: 'Predict antibody structures from sequences' },
];

export default function LearnHubPage() {
  return (
    <>
      {/* Header */}
      <header className="border-b border-[var(--border)] px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
            Learn
          </p>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Learn drug design
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Understand the science behind OpenDDE. From biology basics to advanced computational
            drug design, these guides make complex topics accessible.
          </p>
          <div className="mt-6">
            <Link
              href="/learn/drug-discovery-101"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              Start with the basics
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Articles grid */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-2">
            Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {articleCards.map((article) => (
              <Link
                key={article.slug}
                href={article.slug}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">{article.icon}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    {article.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{article.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-2">{article.readTime}</span>
                  <span className="text-xs font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video tutorials */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-2">
            Video tutorials
          </h2>
          <p className="mb-6 text-muted">
            Short walkthroughs for each major feature.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {videoTutorials.map((video) => (
              <div
                key={video.title}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5"
              >
                {/* Video placeholder */}
                <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-[var(--surface-alt)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <svg className="h-5 w-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{video.title}</h3>
                    <p className="mt-1 text-xs text-muted">{video.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-medium text-muted">
                    {video.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to try it yourself?</h2>
          <p className="mt-3 text-muted">
            The best way to learn drug design is by doing. Launch OpenDDE and explore a real
            protein target.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/app/dashboard"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              Launch app
            </Link>
            <Link
              href="/docs/quick-start"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:border-[var(--border-hover)] transition-colors"
            >
              Read the quick start
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
