'use client';

import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';

export default function AboutBoltz2({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-blue-400" />
          About Boltz-2 — what it&rsquo;s good at, and what it isn&rsquo;t
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-2 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 py-3 text-[11px] leading-relaxed text-muted">
          <p className="text-foreground">
            Boltz-2 is a state-of-the-art structure prediction model with a binding affinity head.
            It approaches FEP accuracy at roughly 1000&times; the speed.
          </p>

          <p className="mt-3 font-medium text-foreground">Use it for</p>
          <ul className="mt-1 space-y-0.5">
            <li><span className="text-emerald-400">&#x2713;</span> Binary binder vs decoy classification (hit discovery)</li>
            <li><span className="text-emerald-400">&#x2713;</span> Triaging large virtual libraries</li>
            <li><span className="text-emerald-400">&#x2713;</span> Shortlisting candidates for experimental testing</li>
          </ul>

          <p className="mt-3 font-medium text-foreground">Treat with caution</p>
          <ul className="mt-1 space-y-0.5">
            <li><span className="text-amber-400">&#x26A0;</span> Fine ranking of close structural analogs (pKi differences under 1 unit)</li>
            <li><span className="text-amber-400">&#x26A0;</span> Pockets with metal cofactors, essential waters, or large allosteric motions</li>
            <li><span className="text-amber-400">&#x26A0;</span> Molecules with metals in the SMILES (will fail standardization)</li>
          </ul>

          <p className="mt-3 text-muted-2">
            A March 2026 evaluation found that while Boltz-2 is a strong classifier, its
            quantitative rankings can break down within the top-performing compounds
            (arXiv:2603.05532). Always validate top hits experimentally.
          </p>
        </div>
      )}
    </div>
  );
}
