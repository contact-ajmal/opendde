'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  memo,
} from 'react';
import { motion } from 'framer-motion';
import { Atom } from 'lucide-react';

import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Color } from 'molstar/lib/mol-util/color/color';

import ViewerToolbar from './ViewerToolbar';

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
  /** Show the floating toolbar overlay (default: true). */
  showToolbar?: boolean;
  /** Optional caption shown in the top-left status chip. */
  label?: string;
}

function MolstarViewerInner(
  {
    structureUrl,
    height = '500px',
    focusPoint,
    onReady,
    showToolbar = true,
    label,
  }: MolstarViewerProps,
  ref: React.Ref<ViewerHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pluginRef = useRef<any>(null);
  // pluginReady forces a re-render once the plugin is fully initialized so the
  // toolbar (which receives the plugin as a prop) can wire up its state.
  const [pluginReady, setPluginReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let localPlugin: any = null;
    setPluginReady(false);

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

        // Pitch-black cinematic background
        plugin.canvas3d?.setProps({
          renderer: { backgroundColor: Color(0x000000) },
        } as any);

        const format = structureUrl.endsWith('.cif') ? 'mmcif' : 'pdb';

        await plugin.clear();
        const data = await plugin.builders.data.download({
          url: structureUrl,
          isBinary: false,
        });

        if (cancelled) return;

        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          format,
        );
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          'default',
        );

        if (cancelled) return;

        setLoading(false);
        setPluginReady(true);
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
      setPluginReady(false);
      if (localPlugin) {
        try {
          localPlugin.dispose();
        } catch (e) {
          // Soft ignore — null parent during rapid unmounts
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
    setRepresentation: () => {
      // Style changes are driven through ViewerToolbar; consumers wanting
      // programmatic control can call getPlugin() and apply directly.
    },
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
      <div
        className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10"
        style={{ height }}
      >
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
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs text-slate-400 font-medium">
              Booting Molecular Engine&hellip;
            </span>
          </div>
        </div>
      )}

      {/* Mol* container + canvas (nested so the plugin owns its own layer) */}
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          style={{ outline: 'none' }}
        />
      </div>

      {/* Subtle bottom gradient so the toolbar reads against busy structures */}
      {showToolbar && pluginReady && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}

      {/* Top-left status chip */}
      {pluginReady && (
        <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-md border border-slate-700/70 bg-[#0a0f1e]/80 px-2 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-md">
          <Atom className="h-3 w-3 text-emerald-400" />
          <span>Mol* engine</span>
          {label && (
            <>
              <span className="mx-0.5 h-2.5 w-px bg-slate-600/70" />
              <span className="text-slate-400">{label}</span>
            </>
          )}
        </div>
      )}

      {/* Floating toolbar */}
      {showToolbar && (
        <ViewerToolbar
          viewer={pluginRef.current}
          containerEl={containerRef.current}
          visible={pluginReady && !loading}
        />
      )}
    </motion.div>
  );
}

const MolstarViewer = memo(forwardRef(MolstarViewerInner));
export default MolstarViewer;
