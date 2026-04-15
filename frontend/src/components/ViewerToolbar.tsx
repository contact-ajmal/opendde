'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Scissors,
  Ruler,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */

type Representation = 'cartoon' | 'surface' | 'ballstick' | 'gaussian' | 'spacefill';
type ColorScheme = 'plddt' | 'chain' | 'element' | 'hydrophobicity' | 'secondary';

interface ViewerToolbarProps {
  viewer: any; // Mol* PluginContext
  containerEl: HTMLDivElement | null;
  visible: boolean;
  onStyleChange?: () => void;
  isMolstar?: boolean;
}

/* ── Button configs ────────────────────────────────────── */

const REPRESENTATIONS: { id: Representation; label: string; key: string; svg: string }[] = [
  { id: 'cartoon',   label: 'Cartoon',          key: '1', svg: 'M4 16c2-4 4 0 6-4s4 0 6-4 4 0 6-4' },
  { id: 'surface',   label: 'Surface',          key: '2', svg: 'M4 14c1-6 5-8 8-8s7 2 8 8c0 3-3 4-8 4s-8-1-8-4z' },
  { id: 'ballstick', label: 'Ball & Stick',     key: '3', svg: 'M6 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 5.5 16.5 15' },
  { id: 'gaussian',  label: 'Gaussian surface',  key: '4', svg: 'M3 15c0-6 4-10 9-10s9 4 9 10c0 3-4 5-9 5s-9-2-9-5z' },
  { id: 'spacefill', label: 'Spacefill',        key: '5', svg: 'M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0' },
];

const COLOR_SCHEMES: { id: ColorScheme; label: string; key: string; svg: string }[] = [
  { id: 'plddt',          label: 'pLDDT / B-factor', key: '', svg: 'M3 19h18M5 19V5l3 4 4-8 4 8 3-4v14' },
  { id: 'chain',          label: 'Chain',             key: '', svg: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  { id: 'hydrophobicity', label: 'Hydrophobicity',    key: '', svg: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z' },
  { id: 'element',        label: 'Element (CPK)',     key: '', svg: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4' },
  { id: 'secondary',      label: 'Secondary structure', key: '', svg: 'M4 6h4v12H4zM12 4c2 0 3 2 3 4s-1 4-3 4-3-2-3-4 1-4 3-4M18 8h2v8h-2' },
];

/* ── Mol* representation + color maps ──────────────────── */

const REP_MAP: Record<Representation, string> = {
  cartoon: 'cartoon',
  surface: 'molecular-surface',
  ballstick: 'ball-and-stick',
  gaussian: 'gaussian-surface',
  spacefill: 'spacefill',
};

const COLOR_MAP: Record<ColorScheme, string> = {
  plddt: 'uncertainty',
  chain: 'chain-id',
  element: 'element-symbol',
  hydrophobicity: 'hydrophobicity',
  secondary: 'secondary-structure-type',
};

async function applyMolstarStyle(plugin: any, rep: Representation, color: ColorScheme) {
  try {
    const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
    const state = plugin.state.data;
    const repType = REP_MAP[rep];
    const colorName = COLOR_MAP[color];
    const cells = state.cells;
    const updates: Promise<void>[] = [];

    cells.forEach((cell: any, ref: string) => {
      if (cell?.transform?.transformer === StateTransforms.Representation.StructureRepresentation3D) {
        if (cell.obj?.label?.startsWith('Pocket-')) return;
        const update = state.build().to(ref).update(
          StateTransforms.Representation.StructureRepresentation3D,
          (old: any) => {
            old.type = { name: repType, params: { ...(old.type?.params || {}), quality: 'medium' } };
            old.colorTheme = { name: colorName, params: {} };
          },
        );
        updates.push(update.commit());
      }
    });
    await Promise.all(updates);
  } catch (err) {
    console.warn('Mol* style change error:', err);
  }
}

/* ── Inline SVG icon helper ────────────────────────────── */

function SvgIcon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────── */

export default function ViewerToolbar({ viewer, containerEl, visible, onStyleChange }: ViewerToolbarProps) {
  const [rep, setRep] = useState<Representation>('cartoon');
  const [color, setColor] = useState<ColorScheme>('plddt');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [clipping, setClipping] = useState(false);
  const [clipDist, setClipDist] = useState(50);
  const [measuring, setMeasuring] = useState(false);
  const [hasMeasurements, setHasMeasurements] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const measClicksRef = useRef<any[]>([]);

  /* ── Apply style ───────────────────────────────────── */
  const applyStyle = useCallback(
    async (newRep: Representation, newColor: ColorScheme) => {
      if (!viewer) return;
      await applyMolstarStyle(viewer, newRep, newColor);
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

  /* ── Screenshot at Nx ──────────────────────────────── */
  async function handleScreenshot(multiplier: number) {
    if (!viewer?.canvas3d) return;
    setCapturing(true);
    try {
      const helper = viewer.helpers?.viewportScreenshot;
      if (helper) {
        const canvas = viewer.canvas3d.webgl.gl.canvas as HTMLCanvasElement;
        const w = canvas.width * multiplier;
        const h = canvas.height * multiplier;

        // Use the helper's built-in high-res export
        helper.behaviors.values.next({
          ...helper.behaviors.values.value,
          resolution: { name: 'custom' as const, params: { width: w, height: h } },
        });
        const uri = await helper.getImageDataUri();

        const link = document.createElement('a');
        link.download = `opendde-structure-${multiplier}x.png`;
        link.href = uri;
        link.click();
      } else {
        // Fallback: direct canvas export (1x only)
        const canvas = viewer.canvas3d.webgl.gl.canvas as HTMLCanvasElement;
        viewer.canvas3d.commit();
        await new Promise(r => requestAnimationFrame(r));
        const uri = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `opendde-structure.png`;
        link.href = uri;
        link.click();
      }
    } catch (err) {
      console.warn('Screenshot error:', err);
    } finally {
      setCapturing(false);
    }
  }

  /* ── Fullscreen ────────────────────────────────────── */
  function handleFullscreen() {
    if (!containerEl) return;
    if (!document.fullscreenElement) {
      containerEl.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  /* ── Reset camera ──────────────────────────────────── */
  function handleReset() {
    viewer?.canvas3d?.requestCameraReset();
  }

  /* ── Spin ──────────────────────────────────────────── */
  function toggleSpin() {
    if (!viewer?.canvas3d) return;
    const next = !spinning;
    setSpinning(next);
    viewer.canvas3d.setProps({
      trackball: {
        animate: next
          ? { name: 'spin' as const, params: { speed: 1 } }
          : { name: 'off' as const, params: {} },
      },
    } as any);
  }

  /* ── Clipping ──────────────────────────────────────── */
  function toggleClipping() {
    if (!viewer?.canvas3d) return;
    const next = !clipping;
    setClipping(next);
    applyClip(next, clipDist);
  }

  function applyClip(enabled: boolean, dist: number) {
    if (!viewer?.canvas3d) return;
    if (enabled) {
      // Use near clipping plane — map 0-100 slider to near distance
      viewer.canvas3d.setProps({
        cameraClipping: { far: false, radius: 100 - dist, minNear: 0.1 },
      } as any);
    } else {
      viewer.canvas3d.setProps({
        cameraClipping: { far: true, radius: 100, minNear: 0.1 },
      } as any);
    }
  }

  function handleClipSlider(val: number) {
    setClipDist(val);
    applyClip(true, val);
  }

  /* ── Measurement mode ──────────────────────────────── */
  useEffect(() => {
    if (!viewer || !measuring) return;

    const sub = viewer.behaviors?.interaction?.click?.subscribe((e: any) => {
      if (!measuring) return;
      const loci = e?.current?.loci;
      if (!loci) return;

      measClicksRef.current.push(loci);

      if (measClicksRef.current.length === 2) {
        const [a, b] = measClicksRef.current;
        try {
          viewer.managers?.structure?.measurement?.addDistance(a, b);
          setHasMeasurements(true);
        } catch { /* some loci may not be valid for distance */ }
        measClicksRef.current = [];
      }
    });

    return () => sub?.unsubscribe?.();
  }, [viewer, measuring]);

  function clearMeasurements() {
    if (!viewer) return;
    try {
      // Remove all measurement group nodes
      const state = viewer.state.data;
      const build = state.build();
      state.cells.forEach((cell: any, ref: string) => {
        if (cell?.obj?.tags?.includes?.('measurement-group') || cell?.obj?.label?.startsWith?.('Distance') || cell?.obj?.label?.startsWith?.('Angle')) {
          build.delete(ref);
        }
      });
      build.commit();
    } catch { /* ignore */ }
    setHasMeasurements(false);
    measClicksRef.current = [];
  }

  /* ── Fullscreen listener ───────────────────────────── */
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
      if (viewer) setTimeout(() => viewer.handleResize(), 100);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [viewer]);

  /* ── Keyboard shortcuts ────────────────────────────── */
  useEffect(() => {
    if (!containerEl) return;

    function onKey(e: KeyboardEvent) {
      // Only handle when viewer area is focused (or body)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case '1': handleRep('cartoon'); break;
        case '2': handleRep('surface'); break;
        case '3': handleRep('ballstick'); break;
        case '4': handleRep('gaussian'); break;
        case '5': handleRep('spacefill'); break;
        case 'c':
        case 'C': {
          const keys = COLOR_SCHEMES.map(c => c.id);
          const next = keys[(keys.indexOf(color) + 1) % keys.length];
          handleColor(next);
          break;
        }
        case 'r':
        case 'R': handleReset(); break;
        case 's':
        case 'S': toggleSpin(); break;
        case 'p':
        case 'P': handleScreenshot(2); break;
        case 'f':
        case 'F': handleFullscreen(); break;
        case 'm':
        case 'M': setMeasuring(v => !v); break;
        case 'x':
        case 'X': toggleClipping(); break;
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerEl, viewer, color, spinning, clipping]);

  /* ── Styles ────────────────────────────────────────── */
  const btn = 'flex h-9 w-9 items-center justify-center rounded-md transition-colors';
  const active = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
  const inactive = 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent';
  const div = 'mx-1 h-6 w-px bg-slate-600/60';

  return (
    <div
      className={`absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* ── Advanced row (toggled) ────────────────────── */}
      {showAdvanced && (
        <div className="flex items-center gap-1 rounded-lg bg-[#0a0f1e]/85 px-3 py-1.5 backdrop-blur-md">
          {/* Screenshot group */}
          <button
            onClick={() => handleScreenshot(2)}
            title="Screenshot 2x (P)"
            className={`${btn} ${inactive} relative`}
            disabled={capturing}
          >
            {capturing
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              : <><Camera className="h-4 w-4" /><span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-emerald-400">2×</span></>
            }
          </button>
          <button
            onClick={() => handleScreenshot(4)}
            title="Screenshot 4x (publication)"
            className={`${btn} ${inactive} relative`}
            disabled={capturing}
          >
            {capturing
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              : <><Download className="h-4 w-4" /><span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-amber-400">4×</span></>
            }
          </button>

          <div className={div} />

          {/* Clipping */}
          <button
            onClick={toggleClipping}
            title="Clipping plane (X)"
            className={`${btn} ${clipping ? active : inactive}`}
          >
            <Scissors className="h-4 w-4" />
          </button>
          {clipping && (
            <input
              type="range"
              min={0}
              max={100}
              value={clipDist}
              onChange={(e) => handleClipSlider(Number(e.target.value))}
              className="mx-1 h-1 w-20 cursor-pointer appearance-none rounded-full bg-slate-600 accent-emerald-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
            />
          )}

          <div className={div} />

          {/* Measurement */}
          <button
            onClick={() => { setMeasuring(v => !v); measClicksRef.current = []; }}
            title="Measure distance (M)"
            className={`${btn} ${measuring ? active : inactive}`}
          >
            <Ruler className="h-4 w-4" />
          </button>
          {hasMeasurements && (
            <button
              onClick={clearMeasurements}
              title="Clear measurements"
              className={`${btn} ${inactive}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div className={div} />

          {/* Spin */}
          <button
            onClick={toggleSpin}
            title="Auto-spin (S)"
            className={`${btn} ${spinning ? active : inactive}`}
          >
            <RefreshCw className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} style={spinning ? { animationDuration: '3s' } : undefined} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            title={`${isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} (F)`}
            className={`${btn} ${isFullscreen ? active : inactive}`}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* ── Main row ─────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-lg bg-[#0a0f1e]/85 px-3 py-1.5 backdrop-blur-md">
        {/* Representations */}
        {REPRESENTATIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRep(r.id)}
            title={`${r.label} (${r.key})`}
            className={`${btn} ${rep === r.id ? active : inactive}`}
          >
            <SvgIcon d={r.svg} />
          </button>
        ))}

        <div className={div} />

        {/* Color schemes — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {COLOR_SCHEMES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleColor(c.id)}
              title={`${c.label} (C to cycle)`}
              className={`${btn} ${color === c.id ? active : inactive}`}
            >
              <SvgIcon d={c.svg} />
            </button>
          ))}
          <div className={div} />
        </div>

        {/* Reset + settings gear */}
        <button onClick={handleReset} title="Reset camera (R)" className={`${btn} ${inactive}`}>
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          title="Advanced controls"
          className={`${btn} ${showAdvanced ? active : inactive}`}
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Mobile: screenshot + fullscreen directly on main row */}
        <div className="flex sm:hidden items-center gap-1">
          <button onClick={() => handleScreenshot(2)} title="Screenshot" className={`${btn} ${inactive}`}>
            <Camera className="h-4 w-4" />
          </button>
          <button onClick={handleFullscreen} title="Fullscreen" className={`${btn} ${inactive}`}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Measurement mode indicator */}
      {measuring && (
        <div className="rounded-md bg-emerald-500/20 px-3 py-1 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
          Measure mode — click two atoms for distance
        </div>
      )}
    </div>
  );
}
