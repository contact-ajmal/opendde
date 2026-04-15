from fastapi import APIRouter, Query
from psycopg.rows import dict_row

from services import database

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
    if not database.pool:
        return []
    try:
        with database.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT uniprot_id, name, gene_name, organism FROM targets ORDER BY resolved_at DESC NULLS LAST LIMIT %s", (limit,))
                return [dict(r) for r in cur.fetchall()]
    except Exception:
        return []


def _search_targets(q: str, limit: int) -> list[dict]:
    if not database.pool:
        return []
    try:
        with database.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                q_like = f"%{q.lower()}%"
                cur.execute("""
                    SELECT uniprot_id, name, gene_name, organism FROM targets 
                    WHERE uniprot_id ILIKE %s OR name ILIKE %s OR gene_name ILIKE %s
                    LIMIT %s
                """, (q_like, q_like, q_like, limit))
                return [dict(r) for r in cur.fetchall()]
    except Exception:
        return []


def _search_ligands(q: str, limit: int) -> list[dict]:
    if not database.pool:
        return []
    try:
        with database.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                q_like = f"%{q.lower()}%"
                cur.execute("""
                    SELECT chembl_id, name, target_id, activity_type, activity_value_nm FROM known_ligands
                    WHERE name ILIKE %s OR chembl_id ILIKE %s
                    LIMIT %s
                """, (q_like, q_like, limit))
                return [dict(r) for r in cur.fetchall()]
    except Exception:
        return []
