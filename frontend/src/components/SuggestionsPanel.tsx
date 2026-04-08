'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PocketResult, KnownLigand } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Suggestion {
  name: string;
  rationale: string;
  base_ligand: string;
  proposed_smiles: string;
  expected_effect: string;
}

interface SuggestionsPanelProps {
  uniprotId: string;
  pocket: PocketResult;
  ligands: KnownLigand[];
  onTestMolecule: (smiles: string, name: string) => void;
}

export default function SuggestionsPanel({ uniprotId, pocket, ligands, onTestMolecule }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch residue properties for pocket context
      let residueProps: any[] = [];
      try {
        const resResp = await fetch(`${API_BASE}/api/v1/pocket/${uniprotId}/${pocket.rank}/residue_properties`);
        if (resResp.ok) {
          const resData = await resResp.json();
          residueProps = resData.residues || [];
        }
      } catch {
        // proceed without residue data
      }

      const topLigands = [...ligands]
        .sort((a, b) => a.activity_value_nm - b.activity_value_nm)
        .slice(0, 5)
        .map(l => ({
          name: l.name,
          smiles: l.smiles,
          activity_type: l.activity_type,
          activity_value_nm: l.activity_value_nm,
        }));

      const resp = await fetch(`${API_BASE}/api/v1/assistant/suggest-ligands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniprot_id: uniprotId,
          pocket_rank: pocket.rank,
          pocket_residues: residueProps,
          known_ligands: topLigands,
          regenerate,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: 'Request failed' }));
        setError(errData.detail || 'Failed to generate suggestions');
        return;
      }

      const data = await resp.json();
      setSuggestions(data.suggestions || []);
      setGenerated(true);
    } catch {
      setError('Connection error. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [uniprotId, pocket, ligands]);

  function handleCopy(smiles: string, idx: number) {
    navigator.clipboard.writeText(smiles);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span>&#10024;</span>
          AI-Suggested Modifications
        </h3>
        {generated && !loading && (
          <button
            onClick={() => generate(true)}
            className="rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {!generated && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-muted mb-4">
            Get AI-powered suggestions for molecular modifications based on this pocket's chemistry and known active ligands.
          </p>
          <button
            onClick={() => generate()}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all"
          >
            <span className="mr-1.5">&#10024;</span>
            Generate suggestions
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-3 py-4">
          <div className="shimmer h-20 rounded-lg" />
          <div className="shimmer h-20 rounded-lg" />
          <div className="shimmer h-20 rounded-lg" />
          <p className="text-center text-xs text-muted">Analyzing pocket chemistry and known ligands...</p>
        </div>
      )}

      {error && (
        <div className="py-4 text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={() => generate()}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      <AnimatePresence>
        {suggestions.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {suggestions.map((s, i) => {
              const isExpanded = expandedIdx === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-lg border transition-colors ${
                    isExpanded ? 'border-emerald-500/40 bg-[var(--hover-row)]' : 'border-border'
                  }`}
                >
                  {/* Header - always visible */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className="flex w-full items-start justify-between p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{s.name}</span>
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                          Based on: {s.base_ligand}
                        </span>
                      </div>
                      <p className="text-xs text-muted truncate">{s.expected_effect}</p>
                    </div>
                    <span className="ml-2 text-xs text-muted flex-shrink-0">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                          {/* Rationale */}
                          <div>
                            <span className="text-xs font-medium text-muted uppercase tracking-wide">Rationale</span>
                            <p className="mt-1 text-sm leading-relaxed text-foreground">{s.rationale}</p>
                          </div>

                          {/* SMILES */}
                          <div>
                            <span className="text-xs font-medium text-muted uppercase tracking-wide">Proposed SMILES</span>
                            <div className="mt-1 flex items-center gap-2">
                              <code className="flex-1 overflow-x-auto rounded bg-[var(--surface-alt)] px-3 py-1.5 text-xs text-amber-400 font-mono">
                                {s.proposed_smiles}
                              </code>
                              <button
                                onClick={() => handleCopy(s.proposed_smiles, i)}
                                className="flex-shrink-0 rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                              >
                                {copiedIdx === i ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          {/* Expected effect */}
                          <div>
                            <span className="text-xs font-medium text-muted uppercase tracking-wide">Expected Effect</span>
                            <p className="mt-1 text-sm text-foreground">{s.expected_effect}</p>
                          </div>

                          {/* Action button */}
                          <button
                            onClick={() => onTestMolecule(s.proposed_smiles, s.name)}
                            className="w-full rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 active:scale-[0.98] transition-all"
                          >
                            Test this molecule &rarr;
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
