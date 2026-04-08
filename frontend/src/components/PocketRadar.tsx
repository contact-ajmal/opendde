'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import { apiGet } from '@/lib/api';

interface PocketComp {
  rank: number;
  score: number;
  druggability: number;
  residue_count: number;
  hydrophobic_ratio: number;
  polar_ratio: number;
  charged_ratio: number;
  aromatic_ratio: number;
}

interface PocketRadarProps {
  uniprotId: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f87171'];
const MAX_POCKETS = 4;

export default function PocketRadar({ uniprotId }: PocketRadarProps) {
  const [pockets, setPockets] = useState<PocketComp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(`/pockets/${uniprotId}/composition`);
        setPockets((data.pockets || []).slice(0, MAX_POCKETS));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uniprotId]);

  if (loading) {
    return <div className="shimmer h-[320px] w-full rounded-lg" />;
  }

  if (pockets.length < 2) return null;

  // Normalize values to 0-1 for radar axes
  const maxScore = Math.max(...pockets.map(p => p.score), 1);
  const maxResidues = Math.max(...pockets.map(p => p.residue_count), 1);

  // Build radar data: one entry per axis, with a value for each pocket
  const axes = [
    { key: 'Score', getValue: (p: PocketComp) => p.score / maxScore },
    { key: 'Druggability', getValue: (p: PocketComp) => p.druggability },
    { key: 'Size', getValue: (p: PocketComp) => p.residue_count / maxResidues },
    { key: 'Hydrophobic', getValue: (p: PocketComp) => p.hydrophobic_ratio },
    { key: 'Polar', getValue: (p: PocketComp) => p.polar_ratio },
    { key: 'Charged', getValue: (p: PocketComp) => p.charged_ratio },
  ];

  const radarData = axes.map(axis => {
    const entry: Record<string, number | string> = { axis: axis.key };
    pockets.forEach((p, i) => {
      entry[`P${p.rank}`] = Math.round(axis.getValue(p) * 100) / 100;
    });
    return entry;
  });

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Pocket Comparison</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={false}
            axisLine={false}
          />
          {pockets.map((p, i) => (
            <Radar
              key={p.rank}
              name={`Pocket ${p.rank}`}
              dataKey={`P${p.rank}`}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              `${(value * 100).toFixed(0)}%`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
