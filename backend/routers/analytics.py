from fastapi import APIRouter
from psycopg.rows import dict_row

from services import database

router = APIRouter()


@router.get("/analytics")
async def get_analytics():
    empty = {
        "overview": {
            "targets_explored": 0,
            "total_pockets": 0,
            "total_ligands": 0,
            "predictions_completed": 0,
            "antibodies_predicted": 0,
        },
        "druggability_distribution": [],
        "top_targets": [],
        "activity_distribution": [],
        "clinical_phase_distribution": [],
        "timeline": [],
    }
    
    if not database.pool:
        return empty

    overview = empty["overview"]

    try:
        with database.pool.connection() as conn:
            with conn.cursor() as cur:
                # ── Overview counts ──
                cur.execute("SELECT COUNT(*) FROM targets")
                r = cur.fetchone()
                if r: overview["targets_explored"] = r[0]

                cur.execute("SELECT COUNT(*) FROM pockets")
                r = cur.fetchone()
                if r: overview["total_pockets"] = r[0]

                cur.execute("SELECT COUNT(*) FROM known_ligands")
                r = cur.fetchone()
                if r: overview["total_ligands"] = r[0]

                cur.execute("SELECT COUNT(*) FROM complex_predictions WHERE status = 'complete'")
                r = cur.fetchone()
                if r: overview["predictions_completed"] = r[0]

                # ── Druggability distribution ──
                drugg_dist = []
                cur.execute("SELECT druggability FROM pockets")
                bins_drugg = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
                for row in cur.fetchall():
                    d = row[0] or 0
                    pct = d * 100
                    if pct < 20: bins_drugg["0-20%"] += 1
                    elif pct < 40: bins_drugg["20-40%"] += 1
                    elif pct < 60: bins_drugg["40-60%"] += 1
                    elif pct < 80: bins_drugg["60-80%"] += 1
                    else: bins_drugg["80-100%"] += 1
                drugg_dist = [{"range": k, "count": v} for k, v in bins_drugg.items()]

                # ── Activity distribution ──
                activity_dist = []
                cur.execute("SELECT activity_value_nm FROM known_ligands WHERE activity_value_nm IS NOT NULL")
                bins_act = {"<1 nM": 0, "1-10 nM": 0, "10-100 nM": 0, "100-1000 nM": 0, ">1 \u00b5M": 0}
                for row in cur.fetchall():
                    val = row[0]
                    if val < 1: bins_act["<1 nM"] += 1
                    elif val < 10: bins_act["1-10 nM"] += 1
                    elif val < 100: bins_act["10-100 nM"] += 1
                    elif val < 1000: bins_act["100-1000 nM"] += 1
                    else: bins_act[">1 \u00b5M"] += 1
                activity_dist = [{"range": k, "count": v} for k, v in bins_act.items()]

                # ── Clinical phase distribution ──
                phase_dist = []
                cur.execute("SELECT clinical_phase FROM known_ligands")
                phase_map = {0: "Preclinical", 1: "Phase I", 2: "Phase II", 3: "Phase III", 4: "Approved"}
                counts_phase = {}
                for row in cur.fetchall():
                    phase = row[0] or 0
                    label = phase_map.get(phase, "Preclinical")
                    counts_phase[label] = counts_phase.get(label, 0) + 1
                for label in ["Approved", "Phase III", "Phase II", "Phase I", "Preclinical"]:
                    if counts_phase.get(label, 0) > 0:
                        phase_dist.append({"phase": label, "count": counts_phase[label]})

                # ── Timeline (targets explored over time) ──
                timeline = []
                cur.execute("SELECT resolved_at FROM targets ORDER BY resolved_at")
                date_counts = {}
                for row in cur.fetchall():
                    ts = row[0]
                    if ts:
                        # Extract YYYY-MM-DD
                        date = ts.isoformat()[:10]
                        date_counts[date] = date_counts.get(date, 0) + 1
                cumulative = 0
                for date in sorted(date_counts.keys()):
                    cumulative += date_counts[date]
                    timeline.append({"date": date, "targets": cumulative, "new": date_counts[date]})

            with conn.cursor(row_factory=dict_row) as dict_cur:
                # ── Top targets (by pocket count) ──
                top_targets = []
                dict_cur.execute("SELECT uniprot_id, name, gene_name FROM targets")
                target_map = {t["uniprot_id"]: t for t in dict_cur.fetchall()}
                
                dict_cur.execute("SELECT target_id, COUNT(*) as c FROM pockets GROUP BY target_id")
                pocket_counts = {r["target_id"]: r["c"] for r in dict_cur.fetchall()}
                
                dict_cur.execute("SELECT target_id, COUNT(*) as c FROM known_ligands GROUP BY target_id")
                ligand_counts = {r["target_id"]: r["c"] for r in dict_cur.fetchall()}

                for uid, info in target_map.items():
                    top_targets.append({
                        "name": info.get("name", uid),
                        "gene_name": info.get("gene_name"),
                        "uniprot_id": uid,
                        "pocket_count": pocket_counts.get(uid, 0),
                        "ligand_count": ligand_counts.get(uid, 0),
                    })
                top_targets.sort(key=lambda x: x["pocket_count"], reverse=True)
                top_targets = top_targets[:10]

    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return empty

    return {
        "overview": overview,
        "druggability_distribution": drugg_dist,
        "top_targets": top_targets,
        "activity_distribution": activity_dist,
        "clinical_phase_distribution": phase_dist,
        "timeline": timeline,
    }


@router.get("/analytics/affinity")
async def get_affinity_analytics():
    empty = {
        "total": 0,
        "status_breakdown": {},
        "avg_runtime_seconds": None,
        "top_targets": [],
        "recent_campaigns": [],
    }
    if not database.pool:
        return empty

    try:
        with database.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM affinity_predictions")
                r = cur.fetchone()
                total = r[0] if r else 0

            with conn.cursor(row_factory=dict_row) as dict_cur:
                dict_cur.execute(
                    "SELECT status, COUNT(*) AS c FROM affinity_predictions GROUP BY status"
                )
                status_breakdown = {r["status"]: r["c"] for r in dict_cur.fetchall()}

                dict_cur.execute(
                    """
                    SELECT EXTRACT(EPOCH FROM AVG(completed_at - created_at))::float AS avg_seconds
                    FROM affinity_predictions
                    WHERE status = 'complete' AND completed_at IS NOT NULL
                    """
                )
                row = dict_cur.fetchone()
                avg_runtime = row["avg_seconds"] if row and row["avg_seconds"] is not None else None

                dict_cur.execute(
                    """
                    SELECT uniprot_id, COUNT(*) AS prediction_count
                    FROM affinity_predictions
                    GROUP BY uniprot_id
                    ORDER BY prediction_count DESC
                    LIMIT 5
                    """
                )
                top_targets = [
                    {"uniprot_id": r["uniprot_id"], "prediction_count": r["prediction_count"]}
                    for r in dict_cur.fetchall()
                ]

                dict_cur.execute(
                    """
                    SELECT id, uniprot_id, name, total_ligands, completed_count,
                           failed_count, created_at, completed_at
                    FROM screening_campaigns
                    ORDER BY created_at DESC
                    LIMIT 10
                    """
                )
                recent_campaigns = []
                for r in dict_cur.fetchall():
                    d = dict(r)
                    d["id"] = str(d["id"])
                    if d.get("created_at"):
                        d["created_at"] = d["created_at"].isoformat()
                    if d.get("completed_at"):
                        d["completed_at"] = d["completed_at"].isoformat()
                    recent_campaigns.append(d)
    except Exception as e:
        print(f"Error fetching affinity analytics: {e}")
        return empty

    return {
        "total": total,
        "status_breakdown": status_breakdown,
        "avg_runtime_seconds": avg_runtime,
        "top_targets": top_targets,
        "recent_campaigns": recent_campaigns,
    }
