'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';

interface Properties {
  smiles: string;
  molecular_weight: number;
  logp: number;
  hbd: number;
  hba: number;
  tpsa: number;
  rotatable_bonds: number;
  num_rings: number;
  num_aromatic_rings: number;
  lipinski_violations: number;
  lipinski_pass: boolean;
  druglikeness_verdict: string;
}

// cache across renders
const propsCache = new Map<string, Properties>();

function MiniGauge({ value, max, warn }: { value: number; max: number; warn: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
      <motion.div
        className={`h-full rounded-full ${warn ? 'bg-red-500' : 'bg-emerald-500'}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

function PropCell({ label, value, max, threshold }: { label: string; value: number; max: number; threshold: number }) {
  const warn = value > threshold;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className={`text-xs font-medium ${warn ? 'text-red-400' : 'text-foreground'}`}>
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        </span>
      </div>
      <MiniGauge value={value} max={max} warn={warn} />
    </div>
  );
}

export default function DruglikenessCard({ smiles }: { smiles: string }) {
  const [props, setProps] = useState<Properties | null>(propsCache.get(smiles) || null);
  const [loading, setLoading] = useState(!propsCache.has(smiles));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propsCache.has(smiles)) {
      setProps(propsCache.get(smiles)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet(`/properties/${encodeURIComponent(smiles)}`)
      .then((data: Properties) => {
        propsCache.set(smiles, data);
        setProps(data);
      })
      .catch((err: any) => setError(err.message || 'Failed'))
      .finally(() => setLoading(false));
  }, [smiles]);

  if (loading) {
    return (
      <div className="shimmer h-36 rounded-lg" />
    );
  }

  if (error || !props) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
        Could not compute properties
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-border bg-[var(--surface)] p-4"
    >
      {/* Header with verdict */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Druglikeness</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            props.lipinski_pass
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {props.druglikeness_verdict}
        </span>
      </div>

      {/* Property grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <PropCell label="MW" value={props.molecular_weight} max={600} threshold={500} />
        <PropCell label="LogP" value={props.logp} max={7} threshold={5} />
        <PropCell label="HBD" value={props.hbd} max={7} threshold={5} />
        <PropCell label="HBA" value={props.hba} max={14} threshold={10} />
        <PropCell label="TPSA" value={props.tpsa} max={200} threshold={140} />
        <PropCell label="Rot. bonds" value={props.rotatable_bonds} max={15} threshold={10} />
      </div>

      {/* Footer */}
      <div className="mt-3 text-center text-[11px] text-muted-2">
        {props.lipinski_violations} of 4 Lipinski rules violated
      </div>
    </motion.div>
  );
}
