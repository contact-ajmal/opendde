'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, memo } from 'react';
import { motion } from 'framer-motion';

export interface PocketHighlight {
  rank: number;
  residues: string[];
  selected: boolean;
  color?: string;
}

interface FocusPoint {
  x: number;
  y: number;
  z: number;
}

export interface ViewerHandle {
  resetCamera: () => void;
  exportImage: () => string;
  setRepresentation: (rep: string, colorScheme: string) => void;
  toggleSpin: (enabled: boolean) => void;
  getPlugin: () => any;
}

interface MolstarViewerProps {
  structureUrl: string;
  height?: string;
  pocketHighlights?: PocketHighlight[];
  focusPoint?: FocusPoint;
  onReady?: () => void;
}

import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Color } from 'molstar/lib/mol-util/color/color';

function MolstarViewerInner(
  { structureUrl, height = '500px', focusPoint, onReady }: MolstarViewerProps,
  ref: React.Ref<ViewerHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pluginRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let localPlugin: any = null;

    async function init() {
      try {
        if (!containerRef.current || !canvasRef.current) return;
        
        const spec = DefaultPluginSpec();
        const plugin = new PluginContext(spec);
        await plugin.init();

        if (cancelled) {
          plugin.dispose();
          return;
        }

        plugin.initViewer(canvasRef.current, containerRef.current);
        localPlugin = plugin;
        pluginRef.current = plugin;

        // Force pitch-black cinematic background
        plugin.canvas3d?.setProps({
          renderer: { backgroundColor: Color(0x000000) },
        } as any);

        const format = structureUrl.endsWith('.cif') ? 'mmcif' : 'pdb';
        
        await plugin.clear();
        const data = await plugin.builders.data.download({ url: structureUrl, isBinary: false });
        
        if (cancelled) return; // Cleanup function will handle disposal

        const trajectory = await plugin.builders.structure.parseTrajectory(data, format);
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

        if (cancelled) return;

        setLoading(false);
        onReady?.();
      } catch (err: any) {
        if (!cancelled) {
          console.error('Mol* Viewer init failed:', err);
          setError(err.message || 'Failed to load structure viewer');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (localPlugin) {
        try {
          localPlugin.dispose();
        } catch (e) {
          // Soft ignore - often a null parent error during rapid unmounts
          console.warn('Molstar soft cleanup:', e);
        }
        localPlugin = null;
        pluginRef.current = null;
      }
    };
  }, [structureUrl]);

  /* ── Focus point ──────────────────────────────────────── */
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin?.canvas3d || !focusPoint) return;

    import('molstar/lib/mol-math/linear-algebra').then(({ Vec3 }) => {
      const position = Vec3.create(focusPoint.x, focusPoint.y, focusPoint.z);
      plugin.canvas3d?.camera.focus(position, 15, 300);
    });
  }, [focusPoint]);

  /* ── Imperative handle ────────────────────────────────── */
  useImperativeHandle(ref, () => ({
    resetCamera: () => pluginRef.current?.canvas3d?.requestCameraReset(),
    exportImage: () => {
      if (!canvasRef.current) return '';
      return canvasRef.current.toDataURL('image/png');
    },
    setRepresentation: () => {},
    toggleSpin: (enabled: boolean) => {
      pluginRef.current?.canvas3d?.setProps({
        trackball: {
          animate: enabled
            ? { name: 'spin', params: { speed: 1 } }
            : { name: 'off', params: {} },
        },
      });
    },
    getPlugin: () => pluginRef.current,
  }));

  /* ── Render ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10" style={{ height }}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full rounded-lg border border-slate-700/50 overflow-hidden shadow-2xl bg-black"
      style={{ height }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs text-slate-400 font-medium">Booting Molecular Engine…</span>
          </div>
        </div>
      )}
      
      {/* Headless Wrapper Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          style={{ width: '100%', height: '100%', outline: 'none' }}
        />
      </div>
    </motion.div>
  );
}

const MolstarViewer = memo(forwardRef(MolstarViewerInner));
export default MolstarViewer;
