'use client';

import { useRouter } from 'next/navigation';

const examples = [
  { gene: 'EGFR', uniprot: 'P00533', context: 'Lung cancer' },
  { gene: 'CDK2', uniprot: 'P24941', context: 'Cell cycle' },
  { gene: 'BRAF', uniprot: 'P15056', context: 'Melanoma' },
  { gene: 'ACE2', uniprot: 'Q9BYF1', context: 'COVID-19 receptor' },
  { gene: 'BCL2', uniprot: 'P10415', context: 'Apoptosis' },
];

export default function ExampleTargets() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {examples.map((t) => (
        <button
          key={t.uniprot}
          onClick={() => router.push(`/app/target/${t.uniprot}`)}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <span className="font-medium">{t.gene}</span>
          <span className="ml-1.5 text-muted">· {t.context}</span>
        </button>
      ))}
    </div>
  );
}
