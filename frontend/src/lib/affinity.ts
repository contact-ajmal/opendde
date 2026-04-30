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
