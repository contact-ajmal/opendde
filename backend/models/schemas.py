from pydantic import BaseModel


class TargetResolveRequest(BaseModel):
    query: str


class PocketResult(BaseModel):
    rank: int
    score: float
    center_x: float
    center_y: float
    center_z: float
    residues: list[str]
    residue_count: int
    druggability: float


class PocketsRequest(BaseModel):
    uniprot_id: str


class PocketsResponse(BaseModel):
    uniprot_id: str
    pocket_count: int
    pockets: list[PocketResult]


class KnownLigand(BaseModel):
    chembl_id: str
    name: str
    smiles: str
    activity_type: str
    activity_value_nm: float
    clinical_phase: int
    clinical_phase_label: str
    image_url: str | None = None


class LigandsResponse(BaseModel):
    uniprot_id: str
    ligand_count: int
    ligands: list[KnownLigand]


class TargetInfo(BaseModel):
    uniprot_id: str
    name: str
    gene_name: str | None = None
    organism: str
    sequence: str
    length: int
    structure_source: str | None = None
    structure_url: str | None = None
    plddt_mean: float | None = None
