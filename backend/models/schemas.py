from pydantic import BaseModel


class TargetResolveRequest(BaseModel):
    query: str


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
