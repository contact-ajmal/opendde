'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { KnownLigand } from '@/lib/types';
import DruglikenessCard from './DruglikenessCard';

interface LigandTableProps {
  ligands: KnownLigand[];
  onPredictComplex?: (ligand: KnownLigand) => void;
}

type SortKey = 'name' | 'activity_value_nm' | 'clinical_phase';

function formatActivity(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mM`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} μM`;
  return `${value.toFixed(1)} nM`;
}

function phaseBadge(phase: number, label: string) {
  const styles: Record<number, string> = {
    4: 'bg-emerald-500/20 text-emerald-400',
    3: 'bg-blue-500/20 text-blue-400',
    2: 'bg-amber-500/20 text-amber-400',
    1: 'bg-[var(--phase-1-bg)] text-[var(--phase-1-text)]',
    0: 'bg-[var(--phase-0-bg)] text-[var(--phase-0-text)]',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[phase] || styles[0]}`}>
      {label}
    </span>
  );
}

function activityBadge(type: string) {
  const colors: Record<string, string> = {
    IC50: 'bg-blue-500/20 text-blue-400',
    Ki: 'bg-purple-500/20 text-purple-400',
    Kd: 'bg-amber-500/20 text-amber-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] || 'bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]'}`}>
      {type}
    </span>
  );
}

export default function LigandTable({ ligands, onPredictComplex }: LigandTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('activity_value_nm');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...ligands].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
    if (sortKey === 'clinical_phase') return mul * (a.clinical_phase - b.clinical_phase);
    return mul * (a.activity_value_nm - b.activity_value_nm);
  });

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortAsc ? ' ↑' : ' ↓';
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Known Ligands</h3>
        <span className="text-sm text-muted">{ligands.length} compounds</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Structure</th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted hover:text-foreground"
                onClick={() => handleSort('name')}
              >
                Name{sortIcon('name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Activity</th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted hover:text-foreground"
                onClick={() => handleSort('activity_value_nm')}
              >
                Value{sortIcon('activity_value_nm')}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted hover:text-foreground"
                onClick={() => handleSort('clinical_phase')}
              >
                Phase{sortIcon('clinical_phase')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lig) => {
              const isExpanded = expandedId === lig.chembl_id;
              return (
                <tr key={lig.chembl_id} className="group border-b border-border last:border-0">
                  {/* Main row - click to expand */}
                  <td
                    colSpan={6}
                    className="p-0"
                  >
                    <div
                      className={`flex items-center transition-colors duration-150 border-l-2 cursor-pointer ${
                        isExpanded
                          ? 'border-l-[var(--accent)] bg-[var(--hover-row)]'
                          : 'border-l-transparent hover:bg-[var(--hover-row)] hover:border-l-[var(--accent)]'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : lig.chembl_id)}
                    >
                      <div className="w-[90px] px-4 py-2 flex-shrink-0">
                        {lig.image_url ? (
                          <img
                            src={lig.image_url}
                            alt={lig.name}
                            loading="lazy"
                            width={60}
                            height={60}
                            className="rounded bg-white transition-transform duration-150 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-[60px] w-[60px] rounded bg-[var(--surface-alt)] ${lig.image_url ? 'hidden' : ''}`} />
                      </div>
                      <div className="min-w-[120px] px-4 py-2">
                        <div className="font-medium text-foreground">{lig.name}</div>
                        <div className="text-xs text-muted">{lig.chembl_id}</div>
                      </div>
                      <div className="px-4 py-2">{activityBadge(lig.activity_type)}</div>
                      <div className="px-4 py-2 text-foreground">{formatActivity(lig.activity_value_nm)}</div>
                      <div className="px-4 py-2">{phaseBadge(lig.clinical_phase, lig.clinical_phase_label)}</div>
                      <div className="px-4 py-2 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onPredictComplex?.(lig); }}
                          disabled={!onPredictComplex}
                          className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30 active:scale-[0.97] transition-transform disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Predict
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : lig.chembl_id); }}
                          className="rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                          title="Druglikeness properties"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded druglikeness card */}
                    <AnimatePresence>
                      {isExpanded && lig.smiles && (
                        <div className="border-t border-border bg-[var(--surface-hover)] px-4 py-3">
                          <DruglikenessCard smiles={lig.smiles} />
                        </div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
