from fastapi import APIRouter, HTTPException

from services.similar import find_similar_targets
from services.database import get_cached_target

router = APIRouter()


@router.get("/target/{uniprot_id}/similar")
async def get_similar(uniprot_id: str, limit: int = 5):
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found. Resolve the target first.")

    try:
        results = await find_similar_targets(uniprot_id, limit=min(limit, 10))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch similar targets: {str(e)}")

    return {"uniprot_id": uniprot_id, "similar_targets": results}
