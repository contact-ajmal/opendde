'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { KnownLigand, AffinityPrediction } from '@/lib/types';
import { nmToPic50 } from '@/lib/affinity';

interface Point {
  name: string;
  experimental: number;
  predicted: number;
  delta: number;
  goodFit: boolean;
}

export default function LigandAffinityScatter({
  ligands,
  predictions,
}: {
  ligands: KnownLigand[];
  predictions: Record<string, AffinityPrediction | undefined>;
}) {
  const points = useMemo<Point[]>(() => {
    const out: Point[] = [];
    for (const lig of ligands) {
      const exp = nmToPic50(lig.activity_value_nm);
      const pred = predictions[lig.smiles]?.pic50;
      if (exp == null || pred == null) continue;
      const delta = Math.abs(exp - pred);
      out.push({
        name: lig.name,
        experimental: Number(exp.toFixed(2)),
        predicted: Number(pred.toFixed(2)),
        delta,
        goodFit: delta <= 1,
      });
    }
    return out;
  }, [ligands, predictions]);

  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[11px] text-muted-2">
        No ligand has both an experimental and predicted pIC50 yet.
      </div>
    );
  }

  const allVals = points.flatMap((p) => [p.experimental, p.predicted]);
  const lo = Math.floor(Math.min(...allVals) - 0.5);
  const hi = Math.ceil(Math.max(...allVals) + 0.5);

  const goodFit = points.filter((p) => p.goodFit);
  const offFit = points.filter((p) => !p.goodFit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-2">
        <span>
          {points.length} ligand{points.length === 1 ? '' : 's'} with both values ·{' '}
          <span className="text-emerald-400">{goodFit.length} within ±1 pIC50</span>
        </span>
        <span>Diagonal = perfect agreement</span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 32, left: 16 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="experimental"
              name="Experimental pIC50"
              domain={[lo, hi]}
              tick={{ fill: 'var(--muted-2)', fontSize: 10 }}
              label={{
                value: 'Experimental pIC50 (ChEMBL)',
                position: 'insideBottom',
                offset: -16,
                fill: 'var(--muted)',
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="predicted"
              name="Predicted pIC50"
              domain={[lo, hi]}
              tick={{ fill: 'var(--muted-2)', fontSize: 10 }}
              label={{
                value: 'Predicted pIC50 (Boltz-2)',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--muted)',
                fontSize: 11,
              }}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-hover)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={(value: number) => value.toFixed(2)}
              labelFormatter={() => ''}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Point;
                return (
                  <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[11px]">
                    <div className="font-medium text-foreground">{d.name}</div>
                    <div className="tabular-nums text-muted">
                      Exp: {d.experimental.toFixed(2)} · Pred: {d.predicted.toFixed(2)}
                    </div>
                    <div
                      className={`tabular-nums ${
                        d.goodFit ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Δ {d.delta.toFixed(2)}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              segment={[
                { x: lo, y: lo },
                { x: hi, y: hi },
              ]}
              stroke="var(--muted-2)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Scatter data={goodFit} fill="#10b981" />
            <Scatter data={offFit} fill="#f59e0b" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
