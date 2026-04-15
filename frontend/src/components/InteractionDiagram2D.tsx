'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { InteractionsResponse } from '@/lib/types';

/* ── Types ────────────────────────────────────────────── */

interface Atom2D {
  index: number;
  symbol: string;
  name: string;
  x: number;
  y: number;
  is_aromatic: boolean;
}

interface Bond2D {
  begin: number;
  end: number;
  order: number;
  is_aromatic: boolean;
}

interface ResidueNode {
  label: string;
  type: string;
  angle: number;
  x: number;
  y: number;
}

interface InteractionDiagram2DProps {
  ligandSmiles: string;
  interactions: InteractionsResponse;
  hoveredResidue?: string | null;
  onHoverResidue?: (residue: string | null) => void;
  width?: number;
  height?: number;
}

/* ── Residue type classification ─────────────────────── */

const RES_TYPE_COLOR: Record<string, string> = {
  hydrophobic: '#f59e0b',
  polar: '#3b82f6',
  charged_positive: '#a855f7',
  charged_negative: '#ef4444',
  aromatic: '#f97316',
  special: '#64748b',
};

const RES_TYPE_MAP: Record<string, string> = {
  ALA: 'hydrophobic', VAL: 'hydrophobic', LEU: 'hydrophobic', ILE: 'hydrophobic',
  MET: 'hydrophobic', PHE: 'aromatic', TRP: 'aromatic', PRO: 'hydrophobic',
  SER: 'polar', THR: 'polar', CYS: 'polar', ASN: 'polar', GLN: 'polar',
  TYR: 'aromatic', GLY: 'special',
  LYS: 'charged_positive', ARG: 'charged_positive', HIS: 'charged_positive',
  ASP: 'charged_negative', GLU: 'charged_negative',
};

function getResType(resLabel: string): string {
  const resname = resLabel.split('_')[0];
  return RES_TYPE_MAP[resname] || 'special';
}

/* ── Interaction line colors ─────────────────────────── */

const INTERACTION_COLORS: Record<string, { stroke: string; dash: string }> = {
  hbond: { stroke: '#3b82f6', dash: '4,3' },
  hydrophobic: { stroke: '#f59e0b', dash: '2,2' },
  pi: { stroke: '#a855f7', dash: '6,2,2,2' },
  salt: { stroke: '#ef4444', dash: '6,4' },
  cation: { stroke: '#ec4899', dash: '4,2' },
};

/* ── Component ────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function InteractionDiagram2D({
  ligandSmiles,
  interactions,
  hoveredResidue,
  onHoverResidue,
  width = 500,
  height = 400,
}: InteractionDiagram2DProps) {
  const [atoms, setAtoms] = useState<Atom2D[]>([]);
  const [bonds, setBonds] = useState<Bond2D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch 2D coordinates from RDKit service
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiPost('/properties/coords2d', { smiles: ligandSmiles })
      .then((data: any) => {
        if (!cancelled) {
          setAtoms(data.atoms || []);
          setBonds(data.bonds || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to get 2D coordinates');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ligandSmiles]);

  // Build residue nodes around the ligand
  const { residueNodes, interactionLines, transformedAtoms, transformedBonds } = useMemo(() => {
    if (atoms.length === 0) {
      return { residueNodes: [], interactionLines: [], transformedAtoms: [], transformedBonds: [] };
    }

    // Transform ligand atoms to fit in center of SVG
    const cx = width / 2;
    const cy = height / 2;
    const padding = 120; // space for residue labels around edge

    const xs = atoms.map((a) => a.x);
    const ys = atoms.map((a) => a.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeY);

    const tAtoms = atoms.map((a) => ({
      ...a,
      tx: cx + (a.x - (minX + maxX) / 2) * scale,
      ty: cy + (a.y - (minY + maxY) / 2) * scale,
    }));

    const tBonds = bonds.map((b) => ({
      ...b,
      x1: tAtoms[b.begin]?.tx || 0,
      y1: tAtoms[b.begin]?.ty || 0,
      x2: tAtoms[b.end]?.tx || 0,
      y2: tAtoms[b.end]?.ty || 0,
    }));

    // Collect unique contact residues and their interaction types
    const residueInfo = new Map<string, { types: Set<string> }>();

    for (const hb of interactions.hydrogen_bonds) {
      const res = hb.protein_atom.split(':')[0];
      if (!residueInfo.has(res)) residueInfo.set(res, { types: new Set() });
      residueInfo.get(res)!.types.add('hbond');
    }
    for (const hc of interactions.hydrophobic_contacts) {
      const res = hc.protein_atom.split(':')[0];
      if (!residueInfo.has(res)) residueInfo.set(res, { types: new Set() });
      residueInfo.get(res)!.types.add('hydrophobic');
    }
    for (const ps of interactions.pi_stacking) {
      const res = ps.protein_ring;
      if (!residueInfo.has(res)) residueInfo.set(res, { types: new Set() });
      residueInfo.get(res)!.types.add('pi');
    }
    for (const sb of interactions.salt_bridges) {
      const res = sb.protein_atom.split(':')[0];
      if (!residueInfo.has(res)) residueInfo.set(res, { types: new Set() });
      residueInfo.get(res)!.types.add('salt');
    }
    for (const cp of interactions.cation_pi) {
      const res = (cp.protein_atom || cp.protein_ring || '').split(':')[0];
      if (res && !residueInfo.has(res)) residueInfo.set(res, { types: new Set() });
      if (res) residueInfo.get(res)!.types.add('cation');
    }

    // Position residues in a ring around the ligand
    const residues = Array.from(residueInfo.entries());
    const radius = Math.min(width, height) / 2 - 30;
    const nodes: ResidueNode[] = residues.map(([label], i) => {
      const angle = (2 * Math.PI * i) / residues.length - Math.PI / 2;
      return {
        label,
        type: getResType(label),
        angle,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    // Build interaction lines from residue to nearest ligand atom
    const lines: {
      type: string;
      x1: number; y1: number;
      x2: number; y2: number;
      distance?: number;
      residue: string;
    }[] = [];

    for (const hb of interactions.hydrogen_bonds) {
      const res = hb.protein_atom.split(':')[0];
      const node = nodes.find((n) => n.label === res);
      if (!node) continue;
      // Connect to ligand centroid as approximation
      lines.push({ type: 'hbond', x1: node.x, y1: node.y, x2: cx, y2: cy, distance: hb.distance, residue: res });
    }
    for (const hc of interactions.hydrophobic_contacts) {
      const res = hc.protein_atom.split(':')[0];
      const node = nodes.find((n) => n.label === res);
      if (!node) continue;
      lines.push({ type: 'hydrophobic', x1: node.x, y1: node.y, x2: cx, y2: cy, distance: hc.distance, residue: res });
    }
    for (const ps of interactions.pi_stacking) {
      const node = nodes.find((n) => n.label === ps.protein_ring);
      if (!node) continue;
      lines.push({ type: 'pi', x1: node.x, y1: node.y, x2: cx, y2: cy, distance: ps.distance, residue: ps.protein_ring });
    }
    for (const sb of interactions.salt_bridges) {
      const res = sb.protein_atom.split(':')[0];
      const node = nodes.find((n) => n.label === res);
      if (!node) continue;
      lines.push({ type: 'salt', x1: node.x, y1: node.y, x2: cx, y2: cy, distance: sb.distance, residue: res });
    }

    // Deduplicate lines by residue+type
    const seenLines = new Set<string>();
    const dedupedLines = lines.filter((l) => {
      const key = `${l.residue}-${l.type}`;
      if (seenLines.has(key)) return false;
      seenLines.add(key);
      return true;
    });

    return {
      residueNodes: nodes,
      interactionLines: dedupedLines,
      transformedAtoms: tAtoms,
      transformedBonds: tBonds,
    };
  }, [atoms, bonds, interactions, width, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ maxWidth: width, maxHeight: height }}
    >
      {/* Background */}
      <rect width={width} height={height} fill="transparent" />

      {/* Interaction lines */}
      {interactionLines.map((line, i) => {
        const style = INTERACTION_COLORS[line.type] || INTERACTION_COLORS.hydrophobic;
        const isHovered = hoveredResidue === line.residue;
        return (
          <g key={`line-${i}`}>
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={style.stroke}
              strokeWidth={isHovered ? 2 : 1}
              strokeDasharray={style.dash}
              opacity={isHovered ? 1 : 0.6}
            />
            {line.distance && (
              <text
                x={(line.x1 + line.x2) / 2}
                y={(line.y1 + line.y2) / 2 - 4}
                fill={style.stroke}
                fontSize="8"
                textAnchor="middle"
                opacity={isHovered ? 1 : 0.5}
              >
                {line.distance.toFixed(1)} A
              </text>
            )}
          </g>
        );
      })}

      {/* Ligand bonds */}
      {transformedBonds.map((b, i) => (
        <line
          key={`bond-${i}`}
          x1={b.x1} y1={b.y1}
          x2={b.x2} y2={b.y2}
          stroke={b.is_aromatic ? '#10b981' : '#94a3b8'}
          strokeWidth={b.order >= 2 ? 2 : 1.5}
          strokeLinecap="round"
        />
      ))}

      {/* Ligand atoms */}
      {transformedAtoms.map((a) => {
        const color = a.symbol === 'C' ? '#10b981' : a.symbol === 'N' ? '#3b82f6'
          : a.symbol === 'O' ? '#ef4444' : a.symbol === 'S' ? '#eab308'
          : a.symbol === 'F' ? '#06b6d4' : a.symbol === 'Cl' ? '#22c55e'
          : '#94a3b8';
        const showLabel = a.symbol !== 'C';
        return (
          <g key={`atom-${a.index}`}>
            <circle cx={a.tx} cy={a.ty} r={showLabel ? 8 : 3} fill={color} opacity={0.9} />
            {showLabel && (
              <text x={a.tx} y={a.ty + 3} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                {a.symbol}
              </text>
            )}
          </g>
        );
      })}

      {/* Residue nodes */}
      {residueNodes.map((node) => {
        const isHovered = hoveredResidue === node.label;
        const fillColor = RES_TYPE_COLOR[node.type] || '#64748b';
        return (
          <g
            key={node.label}
            className="cursor-pointer"
            onMouseEnter={() => onHoverResidue?.(node.label)}
            onMouseLeave={() => onHoverResidue?.(null)}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={isHovered ? 22 : 18}
              fill={fillColor}
              opacity={isHovered ? 0.9 : 0.2}
              stroke={fillColor}
              strokeWidth={isHovered ? 2 : 1}
            />
            <text
              x={node.x}
              y={node.y + 1}
              fill={isHovered ? 'white' : fillColor}
              fontSize="8"
              textAnchor="middle"
              dominantBaseline="central"
              fontWeight="600"
              fontFamily="monospace"
            >
              {node.label.replace(/_/g, ' ')}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(8, ${height - 55})`}>
        <text fill="#94a3b8" fontSize="8" fontWeight="600">INTERACTIONS</text>
        {Object.entries(INTERACTION_COLORS).map(([type, style], i) => (
          <g key={type} transform={`translate(0, ${12 + i * 10})`}>
            <line x1="0" y1="0" x2="16" y2="0" stroke={style.stroke} strokeWidth="1.5" strokeDasharray={style.dash} />
            <text x="20" y="3" fill="#94a3b8" fontSize="7">{type === 'hbond' ? 'H-bond' : type}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
