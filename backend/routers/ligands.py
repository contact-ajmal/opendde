from fastapi import APIRouter

from models.schemas import LigandsResponse, KnownLigand
from services.chembl import fetch_known_ligands

router = APIRouter()

_cache: dict[str, LigandsResponse] = {}


@router.get("/ligands/{uniprot_id}", response_model=LigandsResponse)
async def get_ligands(uniprot_id: str):
    if uniprot_id in _cache:
        return _cache[uniprot_id]

    raw = await fetch_known_ligands(uniprot_id)
    ligands = [KnownLigand(**lig) for lig in raw]

    response = LigandsResponse(
        uniprot_id=uniprot_id,
        ligand_count=len(ligands),
        ligands=ligands,
    )
    _cache[uniprot_id] = response
    return response
