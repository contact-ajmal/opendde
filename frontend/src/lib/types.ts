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

export interface PocketProperties {
  rank: number;
  score: number;
  druggability: number;
  residue_count: number;
  volume_angstrom3: number;
  surface_area_angstrom2: number;
  depth_angstrom: number;
  enclosure_ratio: number;
  center: { x: number; y: number; z: number };
  hydrophobic_ratio: number;
  polar_ratio: number;
  charged_ratio: number;
  aromatic_ratio: number;
  hbond_donors: number;
  hbond_acceptors: number;
  residues_by_type: {
    hydrophobic: string[];
    polar: string[];
    charged_positive: string[];
    charged_negative: string[];
    aromatic: string[];
  };
}

export interface InteractionAtom {
  name: string;
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface HydrogenBond {
  ligand_atom: string;
  protein_atom: string;
  distance: number;
  angle?: number | null;
}

export interface HydrophobicContact {
  ligand_atom: string;
  protein_atom: string;
  distance: number;
}

export interface PiStacking {
  ligand_ring: string;
  protein_ring: string;
  distance: number;
  type: string;
}

export interface SaltBridge {
  ligand_atom: string;
  protein_atom: string;
  distance: number;
}

export interface CationPi {
  ligand_atom?: string;
  protein_atom?: string;
  ligand_ring?: string;
  protein_ring?: string;
  distance: number;
}

export interface InteractionsResponse {
  prediction_id: string;
  ligand_atoms: InteractionAtom[];
  hydrogen_bonds: HydrogenBond[];
  hydrophobic_contacts: HydrophobicContact[];
  pi_stacking: PiStacking[];
  salt_bridges: SaltBridge[];
  cation_pi: CationPi[];
  contact_residues: string[];
}

export interface Prediction {
  prediction_id: string;
  uniprot_id: string;
  ligand_name: string | null;
  ligand_smiles: string | null;
  ligand_ccd: string | null;
  status: string;
  structure_url: string | null;
  created_at: string;
}
