'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiPost, apiGet } from '@/lib/api';
import type { InteractionsResponse } from '@/lib/types';

/* ── Ligand representation modes ──────────────────────── */

export type LigandRepMode = 'ball-stick' | 'spacefill' | 'stick' | 'wire';
export type LigandColorMode = 'element' | 'interaction' | 'uniform';

const REP_OPTIONS: { id: LigandRepMode; label: string }[] = [
  { id: 'ball-stick', label: 'Ball & Stick' },
  { id: 'spacefill', label: 'Spacefill' },
  { id: 'stick', label: 'Stick' },
  { id: 'wire', label: 'Wire' },
];

const COLOR_OPTIONS: { id: LigandColorMode; label: string }[] = [
  { id: 'element', label: 'Element (CPK)' },
  { id: 'interaction', label: 'By interaction' },
  { id: 'uniform', label: 'Uniform green' },
];

interface InteractionViewProps {
  predictionId: string;
  onInteractionsLoaded?: (data: InteractionsResponse) => void;
  hoveredResidue?: string | null;
  onHoverResidue?: (residue: string | null) => void;
}

/* ── Summary card ─────────────────────────────────────── */

function InteractionSummary({ data }: { data: InteractionsResponse }) {
  const counts = [
    { label: 'H-bonds', count: data.hydrogen_bonds.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Hydrophobic', count: data.hydrophobic_contacts.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Pi-stacking', count: data.pi_stacking.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Salt bridges', count: data.salt_bridges.length, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Cation-pi', count: data.cation_pi.length, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {counts.map((c) => (
        <div key={c.label} className={`rounded border border-[var(--border)] ${c.bg} px-2 py-1.5 text-center`}>
          <div className={`text-lg font-bold tabular-nums ${c.color}`}>{c.count}</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-2">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Interaction list ─────────────────────────────────── */

function InteractionList({
  data,
  hoveredResidue,
  onHoverResidue,
}: {
  data: InteractionsResponse;
  hoveredResidue?: string | null;
  onHoverResidue?: (r: string | null) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>('hbonds');

  const sections = [
    {
      id: 'hbonds',
      label: 'Hydrogen Bonds',
      color: 'border-blue-500/40',
      dotColor: 'bg-blue-400',
      items: data.hydrogen_bonds.map((b) => ({
        key: `${b.ligand_atom}-${b.protein_atom}`,
        ligand: b.ligand_atom,
        protein: b.protein_atom,
        distance: b.distance,
        extra: b.angle ? `${b.angle.toFixed(1)}deg` : undefined,
        residue: b.protein_atom.split(':')[0],
      })),
    },
    {
      id: 'hydrophobic',
      label: 'Hydrophobic Contacts',
      color: 'border-amber-500/40',
      dotColor: 'bg-amber-400',
      items: data.hydrophobic_contacts.map((c) => ({
        key: `${c.ligand_atom}-${c.protein_atom}`,
        ligand: c.ligand_atom,
        protein: c.protein_atom,
        distance: c.distance,
        extra: undefined as string | undefined,
        residue: c.protein_atom.split(':')[0],
      })),
    },
    {
      id: 'pi',
      label: 'Pi-Pi Stacking',
      color: 'border-purple-500/40',
      dotColor: 'bg-purple-400',
      items: data.pi_stacking.map((p) => ({
        key: `${p.ligand_ring}-${p.protein_ring}`,
        ligand: p.ligand_ring,
        protein: p.protein_ring,
        distance: p.distance,
        extra: p.type as string | undefined,
        residue: p.protein_ring,
      })),
    },
    {
      id: 'salt',
      label: 'Salt Bridges',
      color: 'border-red-500/40',
      dotColor: 'bg-red-400',
      items: data.salt_bridges.map((s) => ({
        key: `${s.ligand_atom}-${s.protein_atom}`,
        ligand: s.ligand_atom,
        protein: s.protein_atom,
        distance: s.distance,
        extra: undefined as string | undefined,
        residue: s.protein_atom.split(':')[0],
      })),
    },
    {
      id: 'cation',
      label: 'Cation-Pi',
      color: 'border-pink-500/40',
      dotColor: 'bg-pink-400',
      items: data.cation_pi.map((c, i) => ({
        key: `cation-${i}`,
        ligand: c.ligand_atom || c.ligand_ring || '?',
        protein: c.protein_atom || c.protein_ring || '?',
        distance: c.distance,
        extra: undefined as string | undefined,
        residue: (c.protein_atom || c.protein_ring || '').split(':')[0],
      })),
    },
  ];

  return (
    <div className="space-y-1">
      {sections.map((sec) => (
        <div key={sec.id} className={`rounded border ${sec.color} overflow-hidden`}>
          <button
            onClick={() => setExpanded(expanded === sec.id ? null : sec.id)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${sec.dotColor}`} />
              <span className="text-[11px] font-semibold text-foreground">{sec.label}</span>
            </div>
            <span className="text-[10px] tabular-nums text-muted">{sec.items.length}</span>
          </button>
          {expanded === sec.id && sec.items.length > 0 && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {sec.items.slice(0, 20).map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between px-2.5 py-1 text-[10px] transition-colors cursor-default ${
                    hoveredResidue === item.residue ? 'bg-emerald-500/10' : 'hover:bg-[var(--surface-hover)]'
                  }`}
                  onMouseEnter={() => onHoverResidue?.(item.residue)}
                  onMouseLeave={() => onHoverResidue?.(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted">{item.ligand}</span>
                    <span className="text-muted-2">—</span>
                    <span className="font-mono text-foreground">{item.protein}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.extra && <span className="text-muted-2">{item.extra}</span>}
                    <span className="tabular-nums text-muted">{item.distance.toFixed(2)} A</span>
                  </div>
                </div>
              ))}
              {sec.items.length > 20 && (
                <div className="px-2.5 py-1 text-[10px] text-muted-2">
                  +{sec.items.length - 20} more
                </div>
              )}
            </div>
          )}
          {expanded === sec.id && sec.items.length === 0 && (
            <div className="border-t border-[var(--border)] px-2.5 py-2 text-[10px] text-muted-2">
              None detected
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */

export default function InteractionView({
  predictionId,
  onInteractionsLoaded,
  hoveredResidue,
  onHoverResidue,
}: InteractionViewProps) {
  const [data, setData] = useState<InteractionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repMode, setRepMode] = useState<LigandRepMode>('ball-stick');
  const [colorMode, setColorMode] = useState<LigandColorMode>('element');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Try full analysis first, fall back to simple
    apiPost(`/complex/${predictionId}/interactions`, {})
      .then((result) => {
        if (!cancelled) {
          setData(result as InteractionsResponse);
          onInteractionsLoaded?.(result as InteractionsResponse);
        }
      })
      .catch(() => {
        // Fall back to simple endpoint
        return apiGet(`/complex/${predictionId}/interactions/simple`);
      })
      .then((result) => {
        if (!cancelled && result && !data) {
          const adapted: InteractionsResponse = {
            prediction_id: predictionId,
            ligand_atoms: (result as any).ligand_atoms || [],
            hydrogen_bonds: (result as any).hydrogen_bonds || [],
            hydrophobic_contacts: (result as any).hydrophobic_contacts || [],
            pi_stacking: (result as any).pi_stacking || (result as any).aromatic_contacts?.map((a: any) => ({
              ligand_ring: a.ligand_atom,
              protein_ring: a.protein_atom,
              distance: a.distance,
              type: 'contact',
            })) || [],
            salt_bridges: (result as any).salt_bridges || [],
            cation_pi: (result as any).cation_pi || [],
            contact_residues: (result as any).contact_residues || [],
          };
          setData(adapted);
          onInteractionsLoaded?.(adapted);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load interactions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [predictionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
        <span className="text-xs text-muted">Analyzing interactions…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-red-400">{error || 'No interaction data'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Ligand controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2 mr-1">
            Ligand
          </span>
          {REP_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRepMode(opt.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                repMode === opt.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-muted-2 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="h-3 w-px bg-[var(--border)]" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2 mr-1">
            Color
          </span>
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setColorMode(opt.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                colorMode === opt.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-muted-2 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <InteractionSummary data={data} />

      {/* Contact residues */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Contact residues ({data.contact_residues.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {data.contact_residues.slice(0, 30).map((r) => (
            <span
              key={r}
              className={`rounded border px-1.5 py-0.5 font-mono text-[9px] cursor-default transition-colors ${
                hoveredResidue === r
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-[var(--border)] bg-[var(--bg)] text-muted'
              }`}
              onMouseEnter={() => onHoverResidue?.(r)}
              onMouseLeave={() => onHoverResidue?.(null)}
            >
              {r}
            </span>
          ))}
          {data.contact_residues.length > 30 && (
            <span className="text-[9px] text-muted-2">+{data.contact_residues.length - 30} more</span>
          )}
        </div>
      </div>

      {/* Detailed interactions */}
      <InteractionList
        data={data}
        hoveredResidue={hoveredResidue}
        onHoverResidue={onHoverResidue}
      />
    </div>
  );
}
