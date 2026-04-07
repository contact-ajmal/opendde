from fastapi import APIRouter, Query

from services.database import _get_client

router = APIRouter()


@router.get("/search")
async def search(q: str = Query("", min_length=0)):
    q = q.strip()
    if not q:
        # Return recent targets only
        return {"targets": _recent_targets(5), "ligands": []}

    targets = _search_targets(q, 5)
    ligands = _search_ligands(q, 5)
    return {"targets": targets, "ligands": ligands}


def _recent_targets(limit: int) -> list[dict]:
    sb = _get_client()
    if not sb:
        return []
    try:
        resp = (
            sb.table("targets")
            .select("uniprot_id, name, gene_name, organism")
            .order("resolved_at", desc=True)
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


def _search_targets(q: str, limit: int) -> list[dict]:
    sb = _get_client()
    if not sb:
        return []
    try:
        q_lower = q.lower()
        # Search by uniprot_id (exact prefix) or name/gene_name (ilike)
        resp = (
            sb.table("targets")
            .select("uniprot_id, name, gene_name, organism")
            .or_(
                f"uniprot_id.ilike.%{q_lower}%,"
                f"name.ilike.%{q_lower}%,"
                f"gene_name.ilike.%{q_lower}%"
            )
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


def _search_ligands(q: str, limit: int) -> list[dict]:
    sb = _get_client()
    if not sb:
        return []
    try:
        q_lower = q.lower()
        resp = (
            sb.table("known_ligands")
            .select("chembl_id, name, target_id, activity_type, activity_value_nm")
            .or_(
                f"name.ilike.%{q_lower}%,"
                f"chembl_id.ilike.%{q_lower}%"
            )
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []
