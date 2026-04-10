from fastapi import APIRouter

from services.database import _get_client

router = APIRouter()


@router.get("/stats")
async def get_stats():
    sb = _get_client()
    if not sb:
        return {
            "targets_explored": 0,
            "total_pockets_found": 0,
            "total_ligands_catalogued": 0,
            "predictions_completed": 0,
            "recent_targets": [],
            "recent_predictions": [],
        }

    targets_count = 0
    pockets_count = 0
    ligands_count = 0
    predictions_count = 0
    recent_targets: list[dict] = []
    recent_predictions: list[dict] = []

    try:
        resp = sb.table("targets").select("*", count="exact").execute()
        targets_count = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("pockets").select("*", count="exact").execute()
        pockets_count = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("known_ligands").select("*", count="exact").execute()
        ligands_count = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("complex_predictions").select("*", count="exact").eq("status", "complete").execute()
        predictions_count = resp.count or 0
    except Exception:
        pass

    try:
        resp = (
            sb.table("targets")
            .select("uniprot_id, name, gene_name, organism, resolved_at")
            .order("resolved_at", desc=True)
            .limit(5)
            .execute()
        )
        recent_targets = resp.data or []
    except Exception:
        pass

    # Enrich recent targets with pocket / ligand counts (cheap per-row count queries)
    for t in recent_targets:
        uid = t.get("uniprot_id")
        t["pocket_count"] = 0
        t["ligand_count"] = 0
        if not uid:
            continue
        try:
            r = sb.table("pockets").select("*", count="exact").eq("target_id", uid).execute()
            t["pocket_count"] = r.count or 0
        except Exception:
            pass
        try:
            r = sb.table("known_ligands").select("*", count="exact").eq("target_id", uid).execute()
            t["ligand_count"] = r.count or 0
        except Exception:
            pass

    try:
        resp = (
            sb.table("complex_predictions")
            .select("prediction_id, target_id, ligand_name, status, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        recent_predictions = resp.data or []
    except Exception:
        pass

    return {
        "targets_explored": targets_count,
        "total_pockets_found": pockets_count,
        "total_ligands_catalogued": ligands_count,
        "predictions_completed": predictions_count,
        "recent_targets": recent_targets,
        "recent_predictions": recent_predictions,
    }
