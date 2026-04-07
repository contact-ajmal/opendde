'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoleculeEditor from './MoleculeEditor';
import { apiPost } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CustomLigandSectionProps {
  onPredict: (smiles: string, name: string) => void;
}

type Tab = 'type' | 'draw';

interface Validation {
  valid: boolean;
  canonical_smiles: string | null;
  error: string | null;
}

export default function CustomLigandSection({ onPredict }: CustomLigandSectionProps) {
  const [tab, setTab] = useState<Tab>('type');
  const [smiles, setSmiles] = useState('');
  const [validation, setValidation] = useState<Validation | null>(null);
  const [validating, setValidating] = useState(false);
  const [depictUrl, setDepictUrl] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate + depict SMILES with debounce
  const validateSmiles = useCallback((s: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!s.trim()) {
      setValidation(null);
      setDepictUrl(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setValidating(true);
      try {
        const result: Validation = await apiPost('/validate', { smiles: s.trim() });
        setValidation(result);
        if (result.valid) {
          // Generate depiction URL (use POST via a blob)
          const resp = await fetch(`${API_BASE}/api/v1/depict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ smiles: s.trim() }),
          });
          if (resp.ok) {
            const blob = await resp.blob();
            setDepictUrl(URL.createObjectURL(blob));
          } else {
            setDepictUrl(null);
          }
        } else {
          setDepictUrl(null);
        }
      } catch {
        setValidation({ valid: false, canonical_smiles: null, error: 'Validation failed' });
        setDepictUrl(null);
      } finally {
        setValidating(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    validateSmiles(smiles);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [smiles, validateSmiles]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => { if (depictUrl) URL.revokeObjectURL(depictUrl); };
  }, [depictUrl]);

  function handlePredict() {
    const s = smiles.trim();
    if (!s || !validation?.valid) return;
    onPredict(validation.canonical_smiles || s, 'Custom ligand');
  }

  function handleEditorSmiles(editorSmiles: string) {
    setSmiles(editorSmiles);
    setTab('type'); // switch to type tab to show the SMILES
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="mb-3 text-lg font-semibold text-foreground">Custom Ligand</h3>
      <p className="mb-4 text-sm text-muted">
        Enter a SMILES string or draw a molecule to predict binding to this pocket.
      </p>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-[var(--surface-alt)] p-1">
        {(['type', 'draw'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-[var(--surface)] text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t === 'type' ? 'Type SMILES' : 'Draw molecule'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'type' ? (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* SMILES input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
                placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handlePredict}
                disabled={!smiles.trim() || !validation?.valid}
                className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                Predict complex
              </button>
            </div>

            {/* Validation feedback */}
            <div className="mt-2 min-h-[20px]">
              {validating && (
                <span className="text-xs text-muted">Validating…</span>
              )}
              {!validating && validation && (
                validation.valid ? (
                  <span className="text-xs text-emerald-400">
                    ✓ Valid — {validation.canonical_smiles}
                  </span>
                ) : (
                  <span className="text-xs text-red-400">
                    ✗ {validation.error || 'Invalid SMILES'}
                  </span>
                )
              )}
            </div>

            {/* 2D preview */}
            {depictUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 flex justify-center"
              >
                <img
                  src={depictUrl}
                  alt="2D molecule"
                  className="rounded-lg border border-border bg-white"
                  style={{ maxWidth: 300, maxHeight: 200 }}
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="draw"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <MoleculeEditor onSmilesChange={handleEditorSmiles} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
