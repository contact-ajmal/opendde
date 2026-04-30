-- Required for gen_random_uuid() on older Postgres; harmless on pg13+
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS affinity_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  uniprot_id TEXT NOT NULL,
  ligand_smiles TEXT NOT NULL,
  ligand_name TEXT,
  ligand_external_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  affinity_pred_value DOUBLE PRECISION,
  affinity_probability_binary DOUBLE PRECISION,
  pic50 DOUBLE PRECISION,
  ic50_nm DOUBLE PRECISION,
  confidence JSONB,
  complex_cif_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  engine TEXT NOT NULL DEFAULT 'boltz-2'
);

CREATE INDEX IF NOT EXISTS idx_affinity_uniprot
  ON affinity_predictions(uniprot_id);
CREATE INDEX IF NOT EXISTS idx_affinity_smiles
  ON affinity_predictions(uniprot_id, ligand_smiles);
CREATE INDEX IF NOT EXISTS idx_affinity_status_active
  ON affinity_predictions(status)
  WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS screening_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uniprot_id TEXT NOT NULL,
  pocket_rank INTEGER,
  name TEXT,
  total_ligands INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS screening_job_map (
  campaign_id UUID NOT NULL REFERENCES screening_campaigns(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  ligand_name TEXT,
  ligand_smiles TEXT,
  PRIMARY KEY (campaign_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_screening_jobmap_jobid
  ON screening_job_map(job_id);
