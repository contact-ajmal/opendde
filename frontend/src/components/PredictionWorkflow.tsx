'use client';

import { useCallback, useRef, useState } from 'react';
import { apiPost } from '@/lib/api';
import type { TargetInfo, KnownLigand, PrepareResponse, UploadResponse } from '@/lib/types';
import StructureViewer from '@/components/StructureViewer';

interface PredictionWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  targetInfo: TargetInfo;
  ligand: { smiles: string; name: string; ccd?: string } | null;
  onComplete?: () => void;
}

const STEPS = ['Prepare', 'Submit', 'Upload', 'View'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PredictionWorkflow({
  isOpen,
  onClose,
  targetInfo,
  ligand,
  onComplete,
}: PredictionWorkflowProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepareData, setPrepareData] = useState<PrepareResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(0);
    setLoading(false);
    setError(null);
    setPrepareData(null);
    setCopied(false);
    setUploadResult(null);
    setDragOver(false);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePrepare() {
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
      setError(err.message || 'Failed to prepare prediction');
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
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-slate-950 p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
        >
          ×
        </button>

        {/* Step indicators */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i === step
                    ? 'bg-emerald-500 text-white'
                    : i < step
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-muted'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm ${i === step ? 'text-foreground font-medium' : 'text-muted'}`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Prepare */}
        {step === 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Prepare Prediction</h2>
            <div className="mb-4 space-y-2 rounded-lg border border-border bg-surface p-4">
              <div className="flex justify-between">
                <span className="text-muted">Protein</span>
                <span className="text-foreground">{targetInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">UniProt ID</span>
                <span className="font-mono text-foreground">{targetInfo.uniprot_id}</span>
              </div>
              {ligand && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Ligand</span>
                    <span className="text-foreground">{ligand.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">SMILES</span>
                    <span className="max-w-[300px] truncate font-mono text-xs text-foreground">
                      {ligand.smiles}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handlePrepare}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating…
                </span>
              ) : (
                'Generate prediction'
              )}
            </button>
          </div>
        )}

        {/* Step 2: Submit */}
        {step === 1 && prepareData && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Submit to AlphaFold Server</h2>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Job JSON</span>
                <button
                  onClick={handleCopy}
                  className="rounded bg-slate-800 px-3 py-1 text-xs text-foreground hover:bg-slate-700"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-slate-900 p-4 text-xs text-emerald-400">
                {prepareData.job_json_pretty}
              </pre>
            </div>

            <div className="mb-4">
              <a
                href={prepareData.alphafold_server_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/30"
              >
                Open AlphaFold Server →
              </a>
            </div>

            <div className="mb-4 space-y-1">
              {prepareData.instructions.map((inst, i) => (
                <p key={i} className="text-sm text-muted">{inst}</p>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600"
            >
              I&apos;ve submitted the job
            </button>
          </div>
        )}

        {/* Step 3: Upload */}
        {step === 2 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Upload Results</h2>
            <p className="mb-4 text-sm text-muted">
              Download your result from AlphaFold Server and upload the CIF or ZIP file here.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-border bg-surface hover:border-slate-600'
              }`}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted">Uploading…</p>
                </div>
              ) : (
                <>
                  <p className="text-lg text-foreground">Drop CIF or ZIP file here</p>
                  <p className="mt-1 text-sm text-muted">or click to browse</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cif,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Step 4: View */}
        {step === 3 && uploadResult && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Complex Structure</h2>
            <StructureViewer
              structureUrl={`${API_BASE}${uploadResult.structure_url}`}
              height="400px"
            />
            <button
              onClick={() => {
                onComplete?.();
                handleClose();
              }}
              className="mt-4 w-full rounded-lg bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
