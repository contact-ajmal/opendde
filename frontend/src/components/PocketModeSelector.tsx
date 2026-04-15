'use client';

export type PocketVisMode =
  | 'druggability'
  | 'hydrophobicity'
  | 'electrostatics'
  | 'hbonds'
  | 'depth'
  | 'contacts';

interface PocketModeSelectorProps {
  mode: PocketVisMode;
  onChange: (mode: PocketVisMode) => void;
}

const MODES: { id: PocketVisMode; label: string; description: string }[] = [
  { id: 'druggability', label: 'Druggability', description: 'Pocket druggability score overlay' },
  { id: 'hydrophobicity', label: 'Hydrophobic', description: 'Hydrophobic vs polar residues' },
  { id: 'electrostatics', label: 'Charge', description: 'Positive / negative / neutral residues' },
  { id: 'hbonds', label: 'H-Bonds', description: 'Hydrogen bond donors and acceptors' },
  { id: 'depth', label: 'Depth', description: 'Estimated cavity depth' },
  { id: 'contacts', label: 'Contacts', description: 'Residue type contacts' },
];

export default function PocketModeSelector({ mode, onChange }: PocketModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          title={m.description}
          className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            mode === m.id
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-muted-2 hover:text-foreground hover:bg-[var(--surface-hover)] border border-transparent'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
