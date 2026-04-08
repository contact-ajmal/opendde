from fastapi import APIRouter, HTTPException

from services.opentargets import fetch_safety_profile
from services.database import get_cached_target

router = APIRouter()


@router.get("/target/{uniprot_id}/safety")
async def get_safety(uniprot_id: str):
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found. Resolve the target first.")

    try:
        profile = await fetch_safety_profile(uniprot_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch safety data: {str(e)}")

    if not profile:
        raise HTTPException(status_code=404, detail="No safety data found for this target.")

    return profile
