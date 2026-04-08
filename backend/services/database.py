import json
from datetime import datetime, timedelta, timezone

from config import settings

CACHE_TTL_DAYS = 7

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    if "your-project" in settings.SUPABASE_URL:
        return None
    try:
        from supabase import create_client
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _client
    except Exception:
        return None


def _is_stale(timestamp_str: str | None) -> bool:
    if not timestamp_str:
        return True
    try:
        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        return datetime.now(timezone.utc) - ts > timedelta(days=CACHE_TTL_DAYS)
    except Exception:
        return True


# ── Targets ──────────────────────────────────────────────────────────────

def get_cached_target(uniprot_id: str) -> dict | None:
    sb = _get_client()
    if not sb:
        return None
    try:
        resp = sb.table("targets").select("*").eq("uniprot_id", uniprot_id).execute()
        if resp.data and not _is_stale(resp.data[0].get("resolved_at")):
            return resp.data[0]
    except Exception:
        pass
    return None


def cache_target(target: dict) -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        row = {
            "uniprot_id": target["uniprot_id"],
            "name": target["name"],
            "gene_name": target.get("gene_name"),
            "organism": target["organism"],
            "sequence": target["sequence"],
            "length": target["length"],
            "structure_source": target.get("structure_source"),
            "plddt_mean": target.get("plddt_mean"),
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        }
        sb.table("targets").upsert(row, on_conflict="uniprot_id").execute()
    except Exception:
        pass


# ── Pockets ──────────────────────────────────────────────────────────────

def get_cached_pockets(target_id: str) -> list[dict] | None:
    sb = _get_client()
    if not sb:
        return None
    try:
        resp = (
            sb.table("pockets")
            .select("*")
            .eq("target_id", target_id)
            .order("rank")
            .execute()
        )
        if resp.data and not _is_stale(resp.data[0].get("predicted_at")):
            for row in resp.data:
                if isinstance(row.get("residues"), str):
                    row["residues"] = json.loads(row["residues"])
            return resp.data
    except Exception:
        pass
    return None


def cache_pockets(target_id: str, pockets: list[dict]) -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        # Delete old pockets for this target
        sb.table("pockets").delete().eq("target_id", target_id).execute()
        rows = []
        for p in pockets:
            rows.append({
                "target_id": target_id,
                "rank": p["rank"],
                "score": p["score"],
                "druggability": p["druggability"],
                "center_x": p["center_x"],
                "center_y": p["center_y"],
                "center_z": p["center_z"],
                "residues": json.dumps(p["residues"]),
                "residue_count": p["residue_count"],
                "predicted_at": datetime.now(timezone.utc).isoformat(),
            })
        if rows:
            sb.table("pockets").insert(rows).execute()
    except Exception:
        pass


# ── Ligands ──────────────────────────────────────────────────────────────

def get_cached_ligands(target_id: str) -> list[dict] | None:
    sb = _get_client()
    if not sb:
        return None
    try:
        resp = (
            sb.table("known_ligands")
            .select("*")
            .eq("target_id", target_id)
            .order("activity_value_nm")
            .execute()
        )
        if resp.data and not _is_stale(resp.data[0].get("fetched_at")):
            return resp.data
    except Exception:
        pass
    return None


def cache_ligands(target_id: str, ligands: list[dict]) -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        sb.table("known_ligands").delete().eq("target_id", target_id).execute()
        rows = []
        for lig in ligands:
            rows.append({
                "target_id": target_id,
                "chembl_id": lig.get("chembl_id"),
                "name": lig.get("name"),
                "smiles": lig.get("smiles", ""),
                "activity_type": lig.get("activity_type"),
                "activity_value_nm": lig.get("activity_value_nm"),
                "clinical_phase": lig.get("clinical_phase", 0),
                "clinical_phase_label": lig.get("clinical_phase_label", "Preclinical"),
                "image_url": lig.get("image_url"),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            })
        if rows:
            sb.table("known_ligands").insert(rows).execute()
    except Exception:
        pass


# ── Predictions ──────────────────────────────────────────────────────────

def save_prediction(prediction: dict) -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        row = {
            "prediction_id": prediction["prediction_id"],
            "target_id": prediction.get("uniprot_id"),
            "pocket_rank": prediction.get("pocket_rank"),
            "ligand_name": prediction.get("ligand_name"),
            "ligand_smiles": prediction.get("ligand_smiles"),
            "ligand_ccd": prediction.get("ligand_ccd"),
            "status": prediction.get("status", "prepared"),
            "created_at": prediction.get("created_at", datetime.now(timezone.utc).isoformat()),
        }
        sb.table("complex_predictions").upsert(row, on_conflict="prediction_id").execute()
    except Exception:
        pass


def update_prediction_status(prediction_id: str, status: str) -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        sb.table("complex_predictions").update({"status": status}).eq("prediction_id", prediction_id).execute()
    except Exception:
        pass


def get_prediction(prediction_id: str) -> dict | None:
    sb = _get_client()
    if not sb:
        return None
    try:
        resp = (
            sb.table("complex_predictions")
            .select("*")
            .eq("prediction_id", prediction_id)
            .execute()
        )
        if resp.data:
            return resp.data[0]
    except Exception:
        pass
    return None


AI_SUMMARY_TTL_DAYS = 30


def get_cached_ai_summary(target_id: str, summary_type: str = "pocket_analysis") -> str | None:
    sb = _get_client()
    if not sb:
        return None
    try:
        resp = (
            sb.table("ai_summaries")
            .select("summary, generated_at")
            .eq("target_id", target_id)
            .eq("summary_type", summary_type)
            .execute()
        )
        if resp.data:
            row = resp.data[0]
            ts = row.get("generated_at")
            if ts:
                try:
                    generated = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) - generated > timedelta(days=AI_SUMMARY_TTL_DAYS):
                        return None
                except Exception:
                    pass
            return row.get("summary")
    except Exception:
        pass
    return None


def cache_ai_summary(target_id: str, summary: str, summary_type: str = "pocket_analysis") -> None:
    sb = _get_client()
    if not sb:
        return
    try:
        row = {
            "target_id": target_id,
            "summary_type": summary_type,
            "summary": summary,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        sb.table("ai_summaries").upsert(row, on_conflict="target_id,summary_type").execute()
    except Exception:
        pass


def get_predictions_for_target(uniprot_id: str) -> list[dict]:
    sb = _get_client()
    if not sb:
        return []
    try:
        resp = (
            sb.table("complex_predictions")
            .select("*")
            .eq("target_id", uniprot_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []
