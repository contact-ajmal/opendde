import os

from fastapi import APIRouter, HTTPException

from models.schemas import PocketsRequest, PocketsResponse, PocketResult
from engines.p2rank import P2RankEngine
from services.alphafold import fetch_structure
from services.database import get_cached_pockets, cache_pockets

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")

router = APIRouter()
engine = P2RankEngine()


@router.post("/pockets", response_model=PocketsResponse)
async def predict_pockets(req: PocketsRequest):
    # Check Supabase cache
    cached = get_cached_pockets(req.uniprot_id)
    if cached:
        pockets = [
            PocketResult(
                rank=p["rank"],
                score=p["score"],
                center_x=p["center_x"],
                center_y=p["center_y"],
                center_z=p["center_z"],
                residues=p["residues"],
                residue_count=p["residue_count"],
                druggability=p["druggability"],
            )
            for p in cached
        ]
        return PocketsResponse(
            uniprot_id=req.uniprot_id,
            pocket_count=len(pockets),
            pockets=pockets,
        )

    filename = f"{req.uniprot_id}.cif"
    filepath = os.path.join(STRUCTURE_DIR, filename)

    if not os.path.isfile(filepath):
        result = await fetch_structure(req.uniprot_id)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No structure found for {req.uniprot_id}")

    pockets = await engine.predict(filename)

    response = PocketsResponse(
        uniprot_id=req.uniprot_id,
        pocket_count=len(pockets),
        pockets=pockets,
    )

    # Cache in Supabase
    cache_pockets(req.uniprot_id, [p.model_dump() for p in pockets])

    return response
