'use client';

import { useEffect, useState, useRef } from 'react';
import { apiGet } from '@/lib/api';

interface ResidueInfo {
  name: string;
  type: string;
  one_letter: string;
  number: number;
  chain: string;
}

interface PocketMapProps {
  uniprotId: string;
  rank: number;
  druggability: number;
  onResidueClick?: (residueName: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  hydrophobic: '#f59e0b',
  polar: '#3b82f6',
  charged_positive: '#ef4444',
  charged_negative: '#8b5cf6',
  aromatic: '#ec4899',
  special: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  hydrophobic: 'Hydrophobic',
  polar: 'Polar',
  charged_positive: 'Charged (+)',
  charged_negative: 'Charged (−)',
  aromatic: 'Aromatic',
  special: 'Special (Gly)',
};

export default function PocketMap({ uniprotId, rank, druggability, onResidueClick }: PocketMapProps) {
  const [residues, setResidues] = useState<ResidueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(`/pocket/${uniprotId}/${rank}/residue_properties`);
        setResidues(data.residues || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uniprotId, rank]);

  if (loading) {
    return <div className="shimmer h-[320px] w-full rounded-lg" />;
  }

  if (residues.length === 0) {
    return null;
  }

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const centerR = 36;
  const ringR = size / 2 - 30;
  const nodeR = 14;

  const druggPct = (druggability * 100).toFixed(0);
  const druggColor = druggability >= 0.7 ? '#10b981' : druggability >= 0.4 ? '#f59e0b' : '#ef4444';

  // Collect present types for legend
  const presentTypes = [...new Set(residues.map(r => r.type))];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[300px]"
        style={{ aspectRatio: '1' }}
      >
        {/* Lines from center to each residue */}
        {residues.map((r, i) => {
          const angle = (2 * Math.PI * i) / residues.length - Math.PI / 2;
          const x = cx + ringR * Math.cos(angle);
          const y = cy + ringR * Math.sin(angle);
          return (
            <line
              key={`line-${i}`}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="var(--border)"
              strokeWidth={hovered === i ? 1.5 : 0.5}
              strokeOpacity={hovered === i ? 0.8 : 0.3}
            />
          );
        })}

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={centerR} fill="var(--surface)" stroke={druggColor} strokeWidth={2.5} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize={10} fontWeight={600}>
          P{rank}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill={druggColor} fontSize={9} fontWeight={500}>
          {druggPct}%
        </text>

        {/* Residue nodes */}
        {residues.map((r, i) => {
          const angle = (2 * Math.PI * i) / residues.length - Math.PI / 2;
          const x = cx + ringR * Math.cos(angle);
          const y = cy + ringR * Math.sin(angle);
          const color = TYPE_COLORS[r.type] || TYPE_COLORS.special;
          const isHovered = hovered === i;

          return (
            <g
              key={`node-${i}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onResidueClick?.(r.name)}
              className="cursor-pointer"
            >
              <circle
                cx={x} cy={y}
                r={isHovered ? nodeR + 2 : nodeR}
                fill={color}
                fillOpacity={isHovered ? 1 : 0.8}
                stroke={isHovered ? 'var(--text)' : 'none'}
                strokeWidth={1.5}
              />
              <text
                x={x} y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={10}
                fontWeight={600}
                style={{ pointerEvents: 'none' }}
              >
                {r.one_letter}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered !== null && (() => {
          const r = residues[hovered];
          const angle = (2 * Math.PI * hovered) / residues.length - Math.PI / 2;
          // Place tooltip towards center from the node
          const tooltipR = ringR - 24;
          const tx = cx + tooltipR * Math.cos(angle);
          const ty = cy + tooltipR * Math.sin(angle);
          const label = r.name.replace(/_/g, ' ');

          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={tx - 40} y={ty - 12}
                width={80} height={20}
                rx={4}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={0.5}
              />
              <text
                x={tx} y={ty + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text)"
                fontSize={8}
                fontWeight={500}
              >
                {label}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {presentTypes.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.special }}
            />
            <span className="text-xs text-muted">{TYPE_LABELS[type] || type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
