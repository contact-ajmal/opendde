'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from 'recharts';
import { apiPost } from '@/lib/api';
import type { KnownLigand } from '@/lib/types';

interface SARPoint {
  name: string;
  chembl_id: string;
  mw: number;
  activity: number;
  logp: number;
  lipinski_pass: boolean;
  clinical_phase: number;
  phase_label: string;
}

interface SARPlotProps {
  ligands: KnownLigand[];
  onSelectLigand?: (chemblId: string) => void;
}

const PHASE_COLORS: Record<number, string> = {
  4: '#10b981',
  3: '#3b82f6',
  2: '#f59e0b',
  1: '#a78bfa',
  0: '#64748b',
};

const PHASE_LABELS: Record<number, string> = {
  4: 'Approved',
  3: 'Phase III',
  2: 'Phase II',
  1: 'Phase I',
  0: 'Preclinical',
};

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 12,
  padding: '8px 12px',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as SARPoint;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div>MW: {d.mw.toFixed(1)} Da</div>
      <div>{d.phase_label === 'Preclinical' ? 'IC50' : 'Activity'}: {formatActivity(d.activity)}</div>
      <div>LogP: {d.logp.toFixed(2)}</div>
      <div>Lipinski: {d.lipinski_pass ? '✓ Pass' : '✗ Fail'}</div>
      <div style={{ color: PHASE_COLORS[d.clinical_phase] }}>{d.phase_label}</div>
    </div>
  );
}

function formatActivity(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mM`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} µM`;
  return `${value.toFixed(1)} nM`;
}

function SARPlot({ ligands, onSelectLigand }: SARPlotProps) {
  const [data, setData] = useState<SARPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (ligands.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const smilesList = ligands.map(l => l.smiles).filter(Boolean);
      if (smilesList.length === 0) {
        setLoading(false);
        return;
      }

      const props: any[] = await apiPost('/properties/batch', { smiles_list: smilesList });

      // Build a map of SMILES → properties
      const propsMap = new Map<string, any>();
      for (const p of props) {
        if (p.smiles && !p.error) {
          propsMap.set(p.smiles, p);
        }
      }

      const points: SARPoint[] = [];
      for (const lig of ligands) {
        const p = propsMap.get(lig.smiles);
        if (!p) continue;
        if (!lig.activity_value_nm || lig.activity_value_nm <= 0) continue;

        points.push({
          name: lig.name,
          chembl_id: lig.chembl_id,
          mw: p.molecular_weight,
          activity: lig.activity_value_nm,
          logp: p.logp,
          lipinski_pass: p.lipinski_pass,
          clinical_phase: lig.clinical_phase,
          phase_label: PHASE_LABELS[lig.clinical_phase] || 'Preclinical',
        });
      }

      setData(points);
    } catch {
      // silently fail — SAR plot is supplementary
    } finally {
      setLoading(false);
    }
  }, [ligands]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  if (loading) {
    return (
      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <div className="shimmer h-[350px] rounded-lg" />
      </div>
    );
  }

  if (data.length < 2) return null;

  // Build legend payload from present phases
  const presentPhases = [...new Set(data.map(d => d.clinical_phase))].sort((a, b) => b - a);
  const legendPayload = presentPhases.map(p => ({
    value: PHASE_LABELS[p] || 'Preclinical',
    type: 'circle' as const,
    color: PHASE_COLORS[p] || '#64748b',
  }));

  // Compute domain bounds
  const mwValues = data.map(d => d.mw);
  const actValues = data.map(d => d.activity);
  const mwMin = Math.floor(Math.min(...mwValues) * 0.9);
  const mwMax = Math.ceil(Math.max(...mwValues) * 1.1);
  const actMin = Math.max(0.1, Math.min(...actValues) * 0.5);
  const actMax = Math.max(...actValues) * 2;

  return (
    <div className="mb-8 rounded-lg border border-border bg-surface p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-foreground">Structure-Activity Relationship</h3>
        <span className="text-sm text-muted">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          {/* Quadrant labels */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <XAxis
                  type="number"
                  dataKey="mw"
                  name="MW"
                  domain={[mwMin, mwMax]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  label={{ value: 'Molecular Weight (Da)', position: 'bottom', offset: 0, fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="activity"
                  name="Activity"
                  scale="log"
                  domain={[actMin, actMax]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickFormatter={(v: number) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}µM`;
                    return `${v}`;
                  }}
                  label={{ value: 'Activity (nM)', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-secondary)', fontSize: 11 }}
                />

                {/* Lipinski MW boundary */}
                <ReferenceLine
                  x={500}
                  stroke="var(--text-tertiary)"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                />

                {/* Hit threshold */}
                <ReferenceLine
                  y={100}
                  stroke="var(--text-tertiary)"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                />

                <Tooltip content={<CustomTooltip />} />

                <Scatter data={data} onClick={(point: any) => onSelectLigand?.(point.chembl_id)}>
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={PHASE_COLORS[entry.clinical_phase] || '#64748b'}
                      fillOpacity={0.85}
                      stroke={PHASE_COLORS[entry.clinical_phase] || '#64748b'}
                      strokeWidth={1}
                      r={6}
                      style={{ cursor: onSelectLigand ? 'pointer' : 'default' }}
                    />
                  ))}
                </Scatter>

                <Legend payload={legendPayload} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant labels overlay */}
            <div className="pointer-events-none absolute inset-0" style={{ top: 20, left: 50, right: 30, bottom: 60 }}>
              <span className="absolute left-2 top-2 text-[10px] text-muted opacity-50">
                Drug-like, moderate
              </span>
              <span className="absolute right-2 top-2 text-[10px] text-muted opacity-50">
                Large, moderate
              </span>
              <span className="absolute left-2 bottom-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-500/60">
                Drug-like, potent
              </span>
              <span className="absolute right-2 bottom-2 text-[10px] text-muted opacity-50">
                Large but potent
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            <span>Dashed lines: MW = 500 Da (Lipinski), Activity = 100 nM (hit threshold)</span>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(SARPlot);
