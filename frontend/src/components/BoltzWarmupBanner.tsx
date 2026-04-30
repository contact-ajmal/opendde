'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface HealthResponse {
  status: string;
  model_cache_exists?: boolean;
  queue_depth?: number;
  max_concurrent?: number;
}

const POLL_MS = 10_000;

/**
 * Shows a warmup banner whenever the Boltz model weights are not yet present
 * on the service container. Polls /affinity/health every 10 s and dismisses
 * itself the moment model_cache_exists flips to true.
 *
 * Pass `armed=false` to suppress the check until the user actually triggers
 * a prediction — first-load polling would be wasteful.
 */
export default function BoltzWarmupBanner({ armed = true }: { armed?: boolean }) {
  const [needsWarmup, setNeedsWarmup] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!armed || dismissed) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      try {
        const h = (await apiGet('/affinity/health')) as HealthResponse;
        if (cancelled) return;
        const cached = h.model_cache_exists !== false; // default to true if undefined
        setNeedsWarmup(!cached);
        if (cached) return; // weights present — stop polling
      } catch {
        // service may be starting; keep polling
      }
      timer = setTimeout(tick, POLL_MS);
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [armed, dismissed]);

  if (!armed || dismissed || needsWarmup !== true) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-200">
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      <span className="flex-1">
        <span className="font-semibold">First prediction detected.</span>{' '}
        Downloading Boltz-2 model weights (~3 GB). This takes 5&ndash;15 minutes the
        first time; subsequent predictions are fast.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 text-amber-200/70 hover:bg-amber-500/20 hover:text-amber-200"
        aria-label="Dismiss warmup banner"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
