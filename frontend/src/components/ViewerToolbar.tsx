'use client';

import { useState, useEffect, useCallback } from 'react';
import { Camera, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

type Representation = 'cartoon' | 'surface' | 'ballstick' | 'ribbon';
type ColorScheme = 'plddt' | 'chain' | 'element' | 'hydrophobicity';

interface ViewerToolbarProps {
  viewer: any;
  containerEl: HTMLDivElement | null;
  visible: boolean;
  onStyleChange?: () => void; // called after rep/color change so highlights can be reapplied
}

const REPRESENTATIONS: { id: Representation; label: string; icon: string }[] = [
  { id: 'cartoon', label: 'Cartoon', icon: '〰' },
  { id: 'surface', label: 'Surface', icon: '☁' },
  { id: 'ballstick', label: 'Ball & Stick', icon: '⚛' },
  { id: 'ribbon', label: 'Ribbon', icon: '🎗' },
];

const COLOR_SCHEMES: { id: ColorScheme; label: string; icon: string }[] = [
  { id: 'plddt', label: 'pLDDT', icon: '🌈' },
  { id: 'chain', label: 'Chain', icon: '🔗' },
  { id: 'element', label: 'Element', icon: '⚗' },
  { id: 'hydrophobicity', label: 'Hydrophobicity', icon: '💧' },
];

// Kyte-Doolittle hydrophobicity scale mapped to colors
const HYDRO_SCALE: Record<string, number> = {
  ILE: 4.5, VAL: 4.2, LEU: 3.8, PHE: 2.8, CYS: 2.5, MET: 1.9, ALA: 1.8,
  GLY: -0.4, THR: -0.7, SER: -0.8, TRP: -0.9, TYR: -1.3, PRO: -1.6,
  HIS: -3.2, GLU: -3.5, GLN: -3.5, ASP: -3.5, ASN: -3.5, LYS: -3.9, ARG: -4.5,
};

function hydroColor(atom: any): string {
  const res = atom.resn?.toUpperCase() || '';
  const val = HYDRO_SCALE[res] ?? 0;
  // Map -4.5..4.5 → 0..1
  const t = (val + 4.5) / 9;
  // blue(0) → white(0.5) → red(1)
  if (t < 0.5) {
    const f = t * 2;
    const r = Math.round(100 + 155 * f);
    const g = Math.round(100 + 155 * f);
    const b = 255;
    return `rgb(${r},${g},${b})`;
  } else {
    const f = (t - 0.5) * 2;
    const r = 255;
    const g = Math.round(255 - 155 * f);
    const b = Math.round(255 - 155 * f);
    return `rgb(${r},${g},${b})`;
  }
}

function getColorSpec(scheme: ColorScheme): any {
  switch (scheme) {
    case 'plddt':
      return { colorscheme: 'spectral', prop: 'b' };
    case 'chain':
      return { colorscheme: 'chain' };
    case 'element':
      return { colorscheme: 'default' };
    case 'hydrophobicity':
      return { colorfunc: hydroColor };
  }
}

function getStyleSpec(rep: Representation, colorSpec: any): any {
  switch (rep) {
    case 'cartoon':
      return { cartoon: { ...colorSpec } };
    case 'surface':
      return { cartoon: { ...colorSpec, opacity: 0.3 }, stick: { ...colorSpec, radius: 0.1 } };
    case 'ballstick':
      return { sphere: { scale: 0.3, ...colorSpec }, stick: { ...colorSpec } };
    case 'ribbon':
      return { cartoon: { ...colorSpec, style: 'ribbon' } };
  }
}

export default function ViewerToolbar({ viewer, containerEl, visible, onStyleChange }: ViewerToolbarProps) {
  const [rep, setRep] = useState<Representation>('cartoon');
  const [color, setColor] = useState<ColorScheme>('plddt');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const applyStyle = useCallback(
    (newRep: Representation, newColor: ColorScheme) => {
      if (!viewer) return;
      const colorSpec = getColorSpec(newColor);
      const styleSpec = getStyleSpec(newRep, colorSpec);
      viewer.setStyle({}, styleSpec);
      viewer.render();
      onStyleChange?.();
    },
    [viewer, onStyleChange],
  );

  function handleRep(r: Representation) {
    setRep(r);
    applyStyle(r, color);
  }

  function handleColor(c: ColorScheme) {
    setColor(c);
    applyStyle(rep, c);
  }

  function handleScreenshot() {
    if (!viewer) return;
    const uri = viewer.pngURI();
    const link = document.createElement('a');
    link.download = 'opendde-structure.png';
    link.href = uri;
    link.click();
  }

  function handleFullscreen() {
    if (!containerEl) return;
    if (!document.fullscreenElement) {
      containerEl.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function handleReset() {
    if (!viewer) return;
    viewer.zoomTo();
    viewer.render();
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const btnBase =
    'flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors';
  const btnActive = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
  const btnInactive = 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent';

  return (
    <div
      className={`absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-slate-800/90 px-3 py-1.5 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Representation group */}
      {REPRESENTATIONS.map((r) => (
        <button
          key={r.id}
          onClick={() => handleRep(r.id)}
          title={r.label}
          className={`${btnBase} ${rep === r.id ? btnActive : btnInactive}`}
        >
          <span className="text-base leading-none">{r.icon}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="mx-1 h-6 w-px bg-slate-600" />

      {/* Color scheme group */}
      <div className="hidden sm:flex items-center gap-1">
        {COLOR_SCHEMES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleColor(c.id)}
            title={c.label}
            className={`${btnBase} ${color === c.id ? btnActive : btnInactive}`}
          >
            <span className="text-base leading-none">{c.icon}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-600" />
      </div>

      {/* Action buttons */}
      <button onClick={handleScreenshot} title="Screenshot" className={`${btnBase} ${btnInactive}`}>
        <Camera className="h-4 w-4" />
      </button>
      <button onClick={handleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} className={`${btnBase} ${btnInactive}`}>
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      <button onClick={handleReset} title="Reset camera" className={`${btnBase} ${btnInactive}`}>
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
