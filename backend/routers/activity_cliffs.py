import asyncio

from fastapi import APIRouter, HTTPException

from services.database import get_cached_ligands
from engines.rdkit_client import get_similarity

router = APIRouter()

SIMILARITY_THRESHOLD = 0.7
ACTIVITY_RATIO_THRESHOLD = 10
MAX_CLIFFS = 10


@router.post("/activity-cliffs/{uniprot_id}")
async def detect_activity_cliffs(uniprot_id: str):
    """Find ligand pairs with high structural similarity but large activity differences."""
    ligands = get_cached_ligands(uniprot_id)
    if not ligands:
        raise HTTPException(status_code=404, detail="No ligands found. Fetch ligands first.")

    # Filter to ligands with valid SMILES and activity
    valid = [
        l for l in ligands
        if l.get("smiles") and l.get("activity_value_nm") and l["activity_value_nm"] > 0
    ]

    if len(valid) < 2:
        return {"cliffs": [], "pair_count": 0}

    # Cap at 30 ligands to limit pairwise comparisons
    valid = sorted(valid, key=lambda x: x["activity_value_nm"])[:30]

    # Compute pairwise similarities
    pairs = []
    for i in range(len(valid)):
        for j in range(i + 1, len(valid)):
            pairs.append((i, j))

    async def compute_pair(i: int, j: int):
        a, b = valid[i], valid[j]
        try:
            sim = await get_similarity(a["smiles"], b["smiles"])
        except Exception:
            return None

        if sim < SIMILARITY_THRESHOLD:
            return None

        act_a = a["activity_value_nm"]
        act_b = b["activity_value_nm"]
        ratio = max(act_a, act_b) / min(act_a, act_b)

        if ratio < ACTIVITY_RATIO_THRESHOLD:
            return None

        # Order so ligand_a is the more potent one (lower IC50)
        if act_a <= act_b:
            la, lb = a, b
        else:
            la, lb = b, a

        return {
            "ligand_a": {
                "chembl_id": la.get("chembl_id", ""),
                "name": la.get("name", "Unknown"),
                "smiles": la["smiles"],
                "activity_nm": la["activity_value_nm"],
                "image_url": la.get("image_url"),
            },
            "ligand_b": {
                "chembl_id": lb.get("chembl_id", ""),
                "name": lb.get("name", "Unknown"),
                "smiles": lb["smiles"],
                "activity_nm": lb["activity_value_nm"],
                "image_url": lb.get("image_url"),
            },
            "similarity": round(sim, 3),
            "activity_ratio": round(ratio, 1),
        }

    # Run similarity computations concurrently (batched)
    results = await asyncio.gather(*[compute_pair(i, j) for i, j in pairs])
    cliffs = [r for r in results if r is not None]

    # Sort by activity ratio descending, take top N
    cliffs.sort(key=lambda c: c["activity_ratio"], reverse=True)
    cliffs = cliffs[:MAX_CLIFFS]

    return {"cliffs": cliffs, "pair_count": len(cliffs)}
