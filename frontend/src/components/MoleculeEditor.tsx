'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    JSApplet?: any;
    jsmeOnLoad?: () => void;
  }
}

interface MoleculeEditorProps {
  onSmilesChange: (smiles: string) => void;
}

function loadJSME(): Promise<void> {
  return new Promise((resolve) => {
    if (window.JSApplet) {
      resolve();
      return;
    }
    window.jsmeOnLoad = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jsme-editor@2024.8.4/jsme/jsme.nocache.js';
    document.head.appendChild(script);
  });
}

export default function MoleculeEditor({ onSmilesChange }: MoleculeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appletRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadJSME();
      if (cancelled || !containerRef.current) return;

      // JSME needs a short delay after script load
      setTimeout(() => {
        if (cancelled || !containerRef.current) return;
        try {
          const applet = new window.JSApplet.JSME(
            containerRef.current,
            '100%',
            '100%',
            { options: 'query,hydrogens,nocanonize' },
          );
          appletRef.current = applet;
          setReady(true);
        } catch {
          // JSME failed to init
        }
      }, 500);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleGetSmiles = useCallback(() => {
    if (!appletRef.current) return;
    const smiles = appletRef.current.smiles();
    if (smiles) {
      onSmilesChange(smiles);
    }
  }, [onSmilesChange]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="rounded-lg border border-[var(--border)] overflow-hidden bg-white"
        style={{ height: '380px', width: '100%' }}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="shimmer h-full w-full rounded-lg" />
        </div>
      )}
      <button
        onClick={handleGetSmiles}
        disabled={!ready}
        className="self-end rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Use drawn molecule
      </button>
    </div>
  );
}
