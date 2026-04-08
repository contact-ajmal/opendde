from fastapi import APIRouter

from services.database import _get_client

router = APIRouter()


@router.get("/analytics")
async def get_analytics():
    sb = _get_client()
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
    if not sb:
        return empty

    overview = empty["overview"]

    # ── Overview counts ──
    try:
        resp = sb.table("targets").select("*", count="exact").execute()
        overview["targets_explored"] = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("pockets").select("*", count="exact").execute()
        overview["total_pockets"] = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("known_ligands").select("*", count="exact").execute()
        overview["total_ligands"] = resp.count or 0
    except Exception:
        pass

    try:
        resp = sb.table("complex_predictions").select("*", count="exact").eq("status", "complete").execute()
        overview["predictions_completed"] = resp.count or 0
    except Exception:
        pass

    # ── Druggability distribution ──
    drugg_dist = []
    try:
        resp = sb.table("pockets").select("druggability").execute()
        bins = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
        for row in resp.data or []:
            d = row.get("druggability", 0) or 0
            pct = d * 100
            if pct < 20:
                bins["0-20%"] += 1
            elif pct < 40:
                bins["20-40%"] += 1
            elif pct < 60:
                bins["40-60%"] += 1
            elif pct < 80:
                bins["60-80%"] += 1
            else:
                bins["80-100%"] += 1
        drugg_dist = [{"range": k, "count": v} for k, v in bins.items()]
    except Exception:
        pass

    # ── Top targets (by pocket count) ──
    top_targets = []
    try:
        targets_resp = sb.table("targets").select("uniprot_id, name, gene_name").execute()
        target_map = {t["uniprot_id"]: t for t in (targets_resp.data or [])}

        pockets_resp = sb.table("pockets").select("target_id").execute()
        pocket_counts: dict[str, int] = {}
        for p in pockets_resp.data or []:
            tid = p.get("target_id", "")
            pocket_counts[tid] = pocket_counts.get(tid, 0) + 1

        ligands_resp = sb.table("known_ligands").select("target_id").execute()
        ligand_counts: dict[str, int] = {}
        for l in ligands_resp.data or []:
            tid = l.get("target_id", "")
            ligand_counts[tid] = ligand_counts.get(tid, 0) + 1

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
    except Exception:
        pass

    # ── Activity distribution ──
    activity_dist = []
    try:
        resp = sb.table("known_ligands").select("activity_value_nm").execute()
        bins = {"<1 nM": 0, "1-10 nM": 0, "10-100 nM": 0, "100-1000 nM": 0, ">1 µM": 0}
        for row in resp.data or []:
            val = row.get("activity_value_nm")
            if val is None:
                continue
            if val < 1:
                bins["<1 nM"] += 1
            elif val < 10:
                bins["1-10 nM"] += 1
            elif val < 100:
                bins["10-100 nM"] += 1
            elif val < 1000:
                bins["100-1000 nM"] += 1
            else:
                bins[">1 µM"] += 1
        activity_dist = [{"range": k, "count": v} for k, v in bins.items()]
    except Exception:
        pass

    # ── Clinical phase distribution ──
    phase_dist = []
    try:
        resp = sb.table("known_ligands").select("clinical_phase").execute()
        phase_map = {0: "Preclinical", 1: "Phase I", 2: "Phase II", 3: "Phase III", 4: "Approved"}
        counts: dict[str, int] = {}
        for row in resp.data or []:
            phase = row.get("clinical_phase", 0) or 0
            label = phase_map.get(phase, "Preclinical")
            counts[label] = counts.get(label, 0) + 1
        for label in ["Approved", "Phase III", "Phase II", "Phase I", "Preclinical"]:
            if counts.get(label, 0) > 0:
                phase_dist.append({"phase": label, "count": counts[label]})
    except Exception:
        pass

    # ── Timeline (targets explored over time) ──
    timeline = []
    try:
        resp = sb.table("targets").select("resolved_at").order("resolved_at").execute()
        date_counts: dict[str, int] = {}
        for row in resp.data or []:
            ts = row.get("resolved_at", "")
            if ts:
                date = ts[:10]  # YYYY-MM-DD
                date_counts[date] = date_counts.get(date, 0) + 1
        cumulative = 0
        for date in sorted(date_counts.keys()):
            cumulative += date_counts[date]
            timeline.append({"date": date, "targets": cumulative, "new": date_counts[date]})
    except Exception:
        pass

    return {
        "overview": overview,
        "druggability_distribution": drugg_dist,
        "top_targets": top_targets,
        "activity_distribution": activity_dist,
        "clinical_phase_distribution": phase_dist,
        "timeline": timeline,
    }
