import { apiGet, apiPost } from './api';
import type {
  AffinityPrediction,
  CampaignStatusResponse,
} from './types';

export interface SubmitResponse {
  job_id: string;
  cached: boolean;
}

export interface ScreenLigand {
  smiles: string;
  name?: string;
  external_id?: string;
}

export interface ScreenResponse {
  campaign_id: string;
  job_count: number;
}

export async function submitAffinity(
  uniprotId: string,
  smiles: string,
  name?: string,
  externalId?: string,
): Promise<SubmitResponse> {
  return apiPost('/affinity/predict', {
    uniprot_id: uniprotId,
    ligand_smiles: smiles,
    ligand_name: name,
    ligand_external_id: externalId,
  });
}

export async function submitScreen(
  uniprotId: string,
  ligands: ScreenLigand[],
  opts?: { pocket_rank?: number; campaign_name?: string },
): Promise<ScreenResponse> {
  return apiPost('/affinity/screen', {
    uniprot_id: uniprotId,
    pocket_rank: opts?.pocket_rank,
    campaign_name: opts?.campaign_name,
    ligands,
  });
}

export async function getJob(jobId: string): Promise<AffinityPrediction> {
  return apiGet(`/affinity/job/${jobId}`);
}

export async function listForTarget(uniprotId: string): Promise<AffinityPrediction[]> {
  const r = (await apiGet(`/affinity/target/${uniprotId}`)) as {
    predictions: AffinityPrediction[];
  };
  return r.predictions;
}

export async function getCampaign(campaignId: string): Promise<CampaignStatusResponse> {
  return apiGet(`/affinity/campaign/${campaignId}`);
}

const TERMINAL: ReadonlyArray<AffinityPrediction['status']> = [
  'complete',
  'failed',
  'expired',
];

export function isTerminal(status?: string): boolean {
  return !!status && (TERMINAL as string[]).includes(status);
}

/**
 * Poll a single job until terminal. Returns a cancel function.
 */
export function pollJob(
  jobId: string,
  onUpdate: (j: AffinityPrediction) => void,
  intervalMs = 3000,
  maxMinutes = 15,
): () => void {
  let cancelled = false;
  const deadline = Date.now() + maxMinutes * 60_000;

  async function tick() {
    if (cancelled || Date.now() > deadline) return;
    try {
      const job = await getJob(jobId);
      if (cancelled) return;
      onUpdate(job);
      if (isTerminal(job.status)) return;
    } catch {
      /* transient error — keep polling */
    }
    setTimeout(tick, intervalMs);
  }
  tick();
  return () => {
    cancelled = true;
  };
}

/**
 * Poll a campaign and fan results out per-job. One HTTP request covers many jobs.
 * Stops automatically once `completed_at` is set on the campaign.
 */
export function pollCampaign(
  campaignId: string,
  onUpdate: (resp: CampaignStatusResponse) => void,
  intervalMs = 5000,
  maxMinutes = 60,
): () => void {
  let cancelled = false;
  const deadline = Date.now() + maxMinutes * 60_000;

  async function tick() {
    if (cancelled || Date.now() > deadline) return;
    try {
      const resp = await getCampaign(campaignId);
      if (cancelled) return;
      onUpdate(resp);
      if (resp.campaign.completed_at) return;
    } catch {
      /* transient — keep polling */
    }
    setTimeout(tick, intervalMs);
  }
  tick();
  return () => {
    cancelled = true;
  };
}

/**
 * Convert a ChEMBL activity_value_nm into pIC50 = 9 - log10(nM).
 * Returns null if input is non-positive.
 */
export function nmToPic50(nm: number | null | undefined): number | null {
  if (nm == null || nm <= 0 || !Number.isFinite(nm)) return null;
  return 9 - Math.log10(nm);
}

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'unknown';

/**
 * iPTM is Boltz-2's interface predicted-TM score and is the most useful
 * signal for whether to trust the predicted pKi.
 */
export function confidenceTier(iptm: number | null | undefined): ConfidenceTier {
  if (iptm == null) return 'unknown';
  if (iptm >= 0.7) return 'high';
  if (iptm >= 0.5) return 'medium';
  return 'low';
}

/**
 * Combined affinity-magnitude + structural-confidence color: high pKi with
 * low iPTM still warrants a warning.
 */
export function pic50TextColor(pic50: number, tier: ConfidenceTier): string {
  if (tier === 'low') return 'text-amber-400';
  if (pic50 >= 7) return 'text-emerald-400';
  if (pic50 >= 5) return 'text-amber-400';
  return 'text-muted';
}

/**
 * Map a raw boltz/backend error string to something a researcher can act on.
 */
export function friendlyAffinityError(raw: string | null | undefined): string {
  if (!raw) return 'Prediction failed.';
  const s = raw.toLowerCase();
  if (s.includes('metal') || /\[(fe|cu|zn|mn|mg|na|ca|k|li|al|hg|pt|au)/i.test(raw)) {
    return 'Boltz cannot standardize this SMILES (likely contains a metal atom).';
  }
  if (s.includes('standardize') || s.includes('rdkit')) {
    return 'SMILES could not be standardized by RDKit. Check for unusual valences or radicals.';
  }
  if (s.includes('timeout') || s.includes('timed out')) {
    return 'Prediction timed out. Try again or split the run into smaller batches.';
  }
  return raw;
}

export function buildAffinityTooltip(p: AffinityPrediction): string {
  const parts: string[] = [];
  if (p.pic50 != null) parts.push(`pKi ${p.pic50.toFixed(2)}`);
  if (p.ic50_nm != null) {
    const v = p.ic50_nm;
    const fmt =
      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)} mM`
      : v >= 1_000 ? `${(v / 1_000).toFixed(1)} µM`
      : `${v.toFixed(1)} nM`;
    parts.push(`IC50 ${fmt}`);
  }
  const c = p.confidence;
  if (c?.iptm != null) parts.push(`iPTM ${c.iptm.toFixed(2)}`);
  if (c?.plddt != null) parts.push(`pLDDT ${Math.round(c.plddt)}`);
  if (p.affinity_probability_binary != null) {
    parts.push(`binder ${Math.round(p.affinity_probability_binary * 100)}%`);
  }
  if (p.status === 'failed') return friendlyAffinityError(p.error);
  return parts.join(' · ') || 'no result yet';
}
