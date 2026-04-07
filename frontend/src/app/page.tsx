import { Crosshair, FlaskConical, Box } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import ExampleTargets from '@/components/ExampleTargets';

const features = [
  {
    icon: Crosshair,
    title: 'Pocket discovery',
    description: 'Identify binding sites with P2Rank',
  },
  {
    icon: FlaskConical,
    title: 'Ligand intelligence',
    description: 'Known drugs from ChEMBL',
  },
  {
    icon: Box,
    title: 'Complex prediction',
    description: 'Model binding with AlphaFold 3',
  },
];

const howItWorks = [
  {
    icon: Crosshair,
    title: 'Pocket discovery',
    detail: 'P2Rank identifies druggable binding sites on your protein structure using machine learning on geometric and physicochemical features.',
  },
  {
    icon: FlaskConical,
    title: 'Ligand intelligence',
    detail: 'Known drugs and bioactive compounds are fetched from ChEMBL with IC50, Ki, and Kd activity data plus clinical trial status.',
  },
  {
    icon: Box,
    title: 'Complex prediction',
    detail: 'AlphaFold 3 models protein-ligand interactions to predict how a drug candidate binds to its target pocket.',
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-20">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Hero */}
        <div>
          <h1 className="text-5xl font-bold text-primary sm:text-6xl">OpenDDE</h1>
          <p className="mt-2 text-lg text-foreground sm:text-xl">Open Drug Design Engine</p>
        </div>

        <p className="max-w-lg text-muted">
          Discover druggable pockets. Explore known ligands. Predict binding complexes.
        </p>

        {/* Search */}
        <SearchBar />

        {/* Examples */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted">Try an example:</p>
          <ExampleTargets />
        </div>

        {/* Feature cards */}
        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="font-medium text-foreground">{f.title}</h3>
              <p className="text-sm text-muted">{f.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 w-full max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-foreground">How it works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map((item, i) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {i + 1}
                  </div>
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 w-full max-w-4xl border-t border-border pt-8 pb-4">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted">
              OpenDDE — Open Drug Design Engine. Built with AlphaFold 3, P2Rank, and ImmuneBuilder.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="mt-2 text-center text-xs text-muted-2">
            Inspired by Isomorphic Labs&apos; IsoDDE
          </p>
        </footer>
      </div>
    </main>
  );
}
