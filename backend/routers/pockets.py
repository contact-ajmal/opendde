import os

from fastapi import APIRouter, HTTPException

from models.schemas import PocketsRequest, PocketsResponse
from engines.p2rank import P2RankEngine
from services.alphafold import fetch_structure

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")

router = APIRouter()
engine = P2RankEngine()

# Simple in-memory cache
_cache: dict[str, PocketsResponse] = {}


@router.post("/pockets", response_model=PocketsResponse)
async def predict_pockets(req: PocketsRequest):
    if req.uniprot_id in _cache:
        return _cache[req.uniprot_id]

    filename = f"{req.uniprot_id}.cif"
    filepath = os.path.join(STRUCTURE_DIR, filename)

    # Fetch structure if not cached locally
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
    _cache[req.uniprot_id] = response
    return response
