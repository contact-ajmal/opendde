export interface TargetInfo {
  uniprot_id: string;
  name: string;
  gene_name: string | null;
  organism: string;
  sequence: string;
  length: number;
  structure_source: string | null;
  structure_url: string | null;
  plddt_mean: number | null;
}

export interface PocketResult {
  rank: number;
  score: number;
  center_x: number;
  center_y: number;
  center_z: number;
  residues: string[];
  residue_count: number;
  druggability: number;
}

export interface PocketsResponse {
  uniprot_id: string;
  pocket_count: number;
  pockets: PocketResult[];
}

export interface KnownLigand {
  chembl_id: string;
  name: string;
  smiles: string;
  activity_type: string;
  activity_value_nm: number;
  clinical_phase: number;
  clinical_phase_label: string;
  image_url: string | null;
}

export interface LigandsResponse {
  uniprot_id: string;
  ligand_count: number;
  ligands: KnownLigand[];
}

export interface PrepareResponse {
  prediction_id: string;
  job_json: any;
  job_json_pretty: string;
  alphafold_server_url: string;
  instructions: string[];
}

export interface UploadResponse {
  prediction_id: string;
  structure_url: string;
  status: string;
}
