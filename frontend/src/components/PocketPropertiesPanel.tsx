'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { PocketProperties } from '@/lib/types';

interface PocketPropertiesPanelProps {
  uniprotId: string;
  rank: number;
}

function PropertyBar({ label, value, max, color, unit }: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-foreground">
          {value.toFixed(1)}{unit && <span className="text-muted-2 ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function RatioBar({ label, ratio, color }: { label: string; ratio: number; color: string }) {
  const pct = Math.round(ratio * 100);
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-2">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="text-[9px] text-muted-2">{sub}</div>}
    </div>
  );
}

function druggabilityAssessment(d: number): { label: string; color: string; description: string } {
  if (d >= 0.8) return { label: 'Excellent', color: 'text-emerald-400', description: 'Highly druggable — well-enclosed, favorable composition' };
  if (d >= 0.6) return { label: 'Good', color: 'text-emerald-400', description: 'Good druggability — suitable for small molecule targeting' };
  if (d >= 0.4) return { label: 'Moderate', color: 'text-amber-400', description: 'Moderate druggability — may require careful ligand design' };
  if (d >= 0.2) return { label: 'Low', color: 'text-orange-400', description: 'Low druggability — challenging target site' };
  return { label: 'Poor', color: 'text-red-400', description: 'Poor druggability — unlikely binding site' };
}

export default function PocketPropertiesPanel({ uniprotId, rank }: PocketPropertiesPanelProps) {
  const [props, setProps] = useState<PocketProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiGet(`/pocket/${uniprotId}/${rank}/properties`)
      .then((data) => {
        if (!cancelled) setProps(data as PocketProperties);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [uniprotId, rank]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-2" />
      </div>
    );
  }

  if (error || !props) {
    return (
      <div className="px-3 py-4 text-center text-[11px] text-red-400">
        {error || 'Failed to load properties'}
      </div>
    );
  }

  const assessment = druggabilityAssessment(props.druggability);

  return (
    <div className="space-y-4 p-4">
      {/* Druggability assessment */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Druggability
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${assessment.color}`}>{assessment.label}</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {Math.round(props.druggability * 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bar-track)] mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${Math.max(props.druggability * 100, 2)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-2">{assessment.description}</p>
        </div>
      </div>

      {/* Geometry */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Geometry
        </div>
        <div className="space-y-1.5">
          <PropertyBar label="Volume" value={props.volume_angstrom3} max={5000} color="bg-blue-500" unit="A3" />
          <PropertyBar label="Surface area" value={props.surface_area_angstrom2} max={3000} color="bg-cyan-500" unit="A2" />
          <PropertyBar label="Depth" value={props.depth_angstrom} max={30} color="bg-indigo-500" unit="A" />
          <PropertyBar label="Enclosure" value={props.enclosure_ratio * 100} max={100} color="bg-violet-500" unit="%" />
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Residues" value={`${props.residue_count}`} />
        <StatBox label="H-Donors" value={`${props.hbond_donors}`} />
        <StatBox label="H-Accept" value={`${props.hbond_acceptors}`} />
      </div>

      {/* Composition */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Composition
        </div>
        <div className="space-y-1.5">
          <RatioBar label="Hydrophobic" ratio={props.hydrophobic_ratio} color="bg-amber-500" />
          <RatioBar label="Polar" ratio={props.polar_ratio} color="bg-blue-500" />
          <RatioBar label="Charged" ratio={props.charged_ratio} color="bg-purple-500" />
          <RatioBar label="Aromatic" ratio={props.aromatic_ratio} color="bg-pink-500" />
        </div>
      </div>

      {/* Residues by type */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-2">
          Residue breakdown
        </div>
        <div className="space-y-1">
          {Object.entries(props.residues_by_type).map(([type, residues]) => (
            residues.length > 0 && (
              <div key={type} className="flex items-start gap-2">
                <span className="mt-px shrink-0 text-[10px] font-medium capitalize text-muted w-24">
                  {type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-muted-2 font-mono leading-relaxed break-all">
                  {residues.length} residue{residues.length !== 1 ? 's' : ''}
                </span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
