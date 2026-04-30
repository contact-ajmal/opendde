export interface ParsedLigand {
  name: string;
  smiles: string;
  external_id?: string;
  valid?: boolean;
  error?: string;
}

export function parseLigandText(text: string): ParsedLigand[] {
  const out: ParsedLigand[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let name: string;
    let smiles: string;
    if (line.includes('\t')) {
      const [a, ...rest] = line.split('\t');
      name = a.trim();
      smiles = rest.join('\t').trim();
    } else if (line.includes(',')) {
      const [a, ...rest] = line.split(',');
      name = a.trim();
      smiles = rest.join(',').trim();
    } else {
      const m = line.match(/^(\S+)\s+(.+)$/);
      if (m) {
        name = m[1];
        smiles = m[2].trim();
      } else {
        smiles = line;
        name = `lig${out.length + 1}`;
      }
    }
    if (!smiles) continue;
    out.push({ name, smiles });
  }
  return out;
}

export function ligandsToText(ligands: ParsedLigand[]): string {
  return ligands.map((l) => `${l.name}\t${l.smiles}`).join('\n');
}

export function formatNm(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mM`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} µM`;
  return `${v.toFixed(1)} nM`;
}
