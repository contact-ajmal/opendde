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

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Hero */}
        <div>
          <h1 className="text-6xl font-bold text-primary">OpenDDE</h1>
          <p className="mt-2 text-xl text-foreground">Open Drug Design Engine</p>
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* Footer */}
        <p className="mt-12 text-xs text-muted">
          Inspired by Isomorphic Labs&apos; IsoDDE
        </p>
      </div>
    </main>
  );
}
