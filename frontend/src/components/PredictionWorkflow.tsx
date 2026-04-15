'use client';

import { useCallback, useRef, useState } from 'react';
import { apiPost } from '@/lib/api';
import type { TargetInfo, PrepareResponse, UploadResponse } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Beaker, Cloud, Settings2, Download, CheckCircle2 } from 'lucide-react';

const StructureViewer = dynamic(() => import('@/components/MolstarViewer'), {
  ssr: false,
  loading: () => <div className="shimmer h-[400px] w-full" />,
});

interface PredictionWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  targetInfo: TargetInfo;
  ligand: { smiles: string; name: string; ccd?: string } | null;
  pocket?: { rank: number; center_x: number; center_y: number; center_z: number } | null;
  onComplete?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Engine = 'vina' | 'af3';

export default function PredictionWorkflow({
  isOpen,
  onClose,
  targetInfo,
  ligand,
  pocket,
  onComplete,
}: PredictionWorkflowProps) {
  const [engine, setEngine] = useState<Engine>('vina');
  const [step, setStep] = useState(0); // 0: setup, 1: docking/AF3_submit, 2: complete/AF3_upload
  
  // Vina State
  const [exhaustiveness, setExhaustiveness] = useState(8);
  const [vinaResult, setVinaResult] = useState<any>(null);

  // AF3 State
  const [prepareData, setPrepareData] = useState<PrepareResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(0);
    setLoading(false);
    setError(null);
    setPrepareData(null);
    setVinaResult(null);
    setCopied(false);
    setUploadResult(null);
    setDragOver(false);
    setEngine('vina');
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  // --- AutoDock Vina Flow ---
  async function handleDockVina() {
    if (!ligand || !pocket) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/complex/dock_vina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniprot_id: targetInfo.uniprot_id,
          ligand_smiles: ligand.smiles,
          ligand_name: ligand.name,
          center_x: pocket.center_x,
          center_y: pocket.center_y,
          center_z: pocket.center_z,
          exhaustiveness,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Docking failed: ${res.status}`);
      }
      const data = await res.json();
      setVinaResult(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'AutoDock Vina failed');
    } finally {
      setLoading(false);
    }
  }

  // --- AlphaFold 3 Flow ---
  async function handlePrepareAF3() {
    setLoading(true);
    setError(null);
    try {
      const data: PrepareResponse = await apiPost('/complex/prepare', {
        uniprot_id: targetInfo.uniprot_id,
        ligand_smiles: ligand?.smiles || null,
        ligand_ccd: ligand?.ccd || null,
        ligand_name: ligand?.name || null,
      });
      setPrepareData(data);
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to prepare AF3 JSON');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!prepareData) return;
    await navigator.clipboard.writeText(prepareData.job_json_pretty);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUpload(file: File) {
    if (!prepareData) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prediction_id', prepareData.prediction_id);

      const res = await fetch(`${API_BASE}/api/v1/complex/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data: UploadResponse = await res.json();
      setUploadResult(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl glass-panel p-6 shadow-2xl">
        <button onClick={handleClose} className="absolute right-4 top-4 rounded-md p-1 hover:bg-[var(--surface-hover)]">
          <span className="text-xl leading-none text-muted-2">×</span>
        </button>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* STEP 0: Engine Selection & Setup */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Complex Prediction</h2>
              <p className="text-sm text-muted-2">Select a computational engine to dock the ligand into the structure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setEngine('vina')}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  engine === 'vina'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/50'
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Beaker className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">AutoDock Vina</h3>
                <p className="mt-1 text-xs text-muted-2">Fast, physical local docking directly into Pocket #{pocket?.rank || 'Unknown'}. Takes ~30 seconds.</p>
                {!pocket && <p className="mt-2 text-[10px] text-red-400">Requires a selected pocket to dock into.</p>}
              </button>

              <button
                onClick={() => setEngine('af3')}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  engine === 'af3'
                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/50'
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Cloud className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">AlphaFold 3</h3>
                <p className="mt-1 text-xs text-muted-2">Global structure prediction via Google DeepMind cloud. Requires external API submission.</p>
              </button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Parameters
              </h4>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-2">Target</span>
                  <span className="font-medium text-foreground">{targetInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-2">Ligand</span>
                  <span className="font-mono text-[11px] text-emerald-400">{ligand?.smiles}</span>
                </div>
                {engine === 'vina' && (
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 mt-1">
                    <span className="text-muted-2">Exhaustiveness (Search Iterations)</span>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="4" max="32" step="4" 
                        value={exhaustiveness} 
                        onChange={(e) => setExhaustiveness(parseInt(e.target.value))}
                        className="w-24 accent-emerald-500"
                      />
                      <span className="w-6 text-right tabular-nums text-foreground">{exhaustiveness}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Cancel
              </button>
              {engine === 'vina' ? (
                <button
                  onClick={handleDockVina}
                  disabled={loading || !pocket}
                  className="flex min-w-[120px] items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Docking'}
                </button>
              ) : (
                <button
                  onClick={handlePrepareAF3}
                  disabled={loading}
                  className="flex min-w-[120px] items-center justify-center rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Setup Job'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: AF3 JSON instructions */}
        {step === 1 && engine === 'af3' && prepareData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Upload to AlphaFold Server</h2>
              <p className="mt-1 text-sm text-muted-2">Copy the Job JSON and upload it to the external AlphaFold 3 web portal.</p>
            </div>

            <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 rounded-md bg-[var(--surface-hover)] px-2.5 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-emerald-500 hover:text-white"
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <pre className="max-h-48 overflow-auto text-[10px] text-muted-2 font-mono scrollbar-thin">
                {prepareData.job_json_pretty}
              </pre>
            </div>

            <div className="flex gap-3">
              <a
                href={prepareData.alphafold_server_url} target="_blank" rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
              >
                Open AlphaFold Server ↗
              </a>
              <button
                onClick={() => setStep(2)}
                className="flex flex-1 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                I have the Result CIF
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AF3 Upload OR View Results */}
        {step === 2 && engine === 'af3' && !uploadResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Extract Results</h2>
              <p className="mt-1 text-sm text-muted-2">Upload the resulting CIF file from AlphaFold to view the complex.</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-blue-500/50'
              }`}
            >
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <>
                  <Download className="mb-3 h-8 w-8 text-muted-2" />
                  <p className="font-medium text-foreground">Drop CIF or ZIP file here</p>
                  <p className="text-xs text-muted-2">or click to browse</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".cif,.zip" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          </div>
        )}

        {/* Completion View (Vina or AF3 Uploaded) */}
        {((step === 2 && engine === 'vina' && vinaResult) || (step === 2 && engine === 'af3' && uploadResult)) && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Structure Generated!</h2>
                <p className="text-sm text-muted-2">
                  {engine === 'vina' ? 'AutoDock Vina localized docking complete.' : 'AlphaFold 3 complex embedded.'}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <StructureViewer
                structureUrl={engine === 'vina' ? `${API_BASE}${vinaResult.structure_url}` : `${API_BASE}${uploadResult?.structure_url}`}
                height="350px"
              />
            </div>

            <div className="flex justify-end pr-2 gap-3">
              <button
                onClick={() => {
                  handleClose();
                  onComplete?.();
                }}
                className="rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] px-6 py-2 text-sm font-semibold text-foreground hover:bg-[var(--surface-hover)]"
              >
                Close & View on Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
