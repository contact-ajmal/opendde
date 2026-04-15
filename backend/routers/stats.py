from fastapi import APIRouter
from psycopg.rows import dict_row

from services import database

router = APIRouter()


@router.get("/stats")
async def get_stats():
    if not database.pool:
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
        with database.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM targets")
                row = cur.fetchone()
                if row: targets_count = row[0]
                
                cur.execute("SELECT COUNT(*) FROM pockets")
                row = cur.fetchone()
                if row: pockets_count = row[0]
                
                cur.execute("SELECT COUNT(*) FROM known_ligands")
                row = cur.fetchone()
                if row: ligands_count = row[0]
                
                cur.execute("SELECT COUNT(*) FROM complex_predictions WHERE status = 'complete'")
                row = cur.fetchone()
                if row: predictions_count = row[0]

            with conn.cursor(row_factory=dict_row) as dict_cur:
                dict_cur.execute("""
                    SELECT uniprot_id, name, gene_name, organism, resolved_at 
                    FROM targets 
                    ORDER BY resolved_at DESC NULLS LAST LIMIT 5
                """)
                targets_rows = dict_cur.fetchall()
                for row in targets_rows:
                    t = dict(row)
                    if t.get("resolved_at"):
                        t["resolved_at"] = t["resolved_at"].isoformat()
                    t["pocket_count"] = 0
                    t["ligand_count"] = 0
                    uid = t.get("uniprot_id")
                    if uid:
                        with conn.cursor() as c:
                            c.execute("SELECT COUNT(*) FROM pockets WHERE target_id = %s", (uid,))
                            c_row = c.fetchone()
                            if c_row: t["pocket_count"] = c_row[0]
                            
                            c.execute("SELECT COUNT(*) FROM known_ligands WHERE target_id = %s", (uid,))
                            c_row = c.fetchone()
                            if c_row: t["ligand_count"] = c_row[0]
                    recent_targets.append(t)

                dict_cur.execute("""
                    SELECT prediction_id, target_id, ligand_name, status, created_at 
                    FROM complex_predictions 
                    ORDER BY created_at DESC NULLS LAST LIMIT 5
                """)
                preds_rows = dict_cur.fetchall()
                for row in preds_rows:
                    p = dict(row)
                    if p.get("created_at"):
                        p["created_at"] = p["created_at"].isoformat()
                    recent_predictions.append(p)
                    
    except Exception as e:
        print(f"Error fetching stats: {e}")

    return {
        "targets_explored": targets_count,
        "total_pockets_found": pockets_count,
        "total_ligands_catalogued": ligands_count,
        "predictions_completed": predictions_count,
        "recent_targets": recent_targets,
        "recent_predictions": recent_predictions,
    }
