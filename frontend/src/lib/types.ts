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
