from fastapi import APIRouter

from models.schemas import LigandsResponse, KnownLigand
from services.chembl import fetch_known_ligands
from services.database import get_cached_ligands, cache_ligands

router = APIRouter()


@router.get("/ligands/{uniprot_id}", response_model=LigandsResponse)
async def get_ligands(uniprot_id: str):
    # Check Supabase cache
    cached = get_cached_ligands(uniprot_id)
    if cached:
        ligands = [
            KnownLigand(
                chembl_id=row.get("chembl_id", ""),
                name=row.get("name", ""),
                smiles=row.get("smiles", ""),
                activity_type=row.get("activity_type", ""),
                activity_value_nm=row.get("activity_value_nm", 0),
                clinical_phase=row.get("clinical_phase", 0),
                clinical_phase_label=row.get("clinical_phase_label", "Preclinical"),
                image_url=row.get("image_url"),
            )
            for row in cached
        ]
        return LigandsResponse(
            uniprot_id=uniprot_id,
            ligand_count=len(ligands),
            ligands=ligands,
        )

    raw = await fetch_known_ligands(uniprot_id)
    raw = [lig for lig in raw if lig.get("smiles")]
    ligands = [KnownLigand(**lig) for lig in raw]

    # Cache in Supabase
    cache_ligands(uniprot_id, raw)

    return LigandsResponse(
        uniprot_id=uniprot_id,
        ligand_count=len(ligands),
        ligands=ligands,
    )
