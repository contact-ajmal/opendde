import json
from datetime import datetime, timedelta, timezone

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from config import settings

CACHE_TTL_DAYS = 7
AI_SUMMARY_TTL_DAYS = 30

pool = None


def init_db():
    global pool
    if not settings.DATABASE_URL:
        return
    try:
        pool = ConnectionPool(settings.DATABASE_URL, min_size=1, max_size=10)
        # pool automatically opens
    except Exception as e:
        print(f"Failed to initialize database pool: {e}")
        pool = None


def close_db():
    global pool
    if pool:
        pool.close()
        pool = None


def _is_stale(timestamp_str: str | datetime | None, ttl_days: int) -> bool:
    if not timestamp_str:
        return True
    try:
        if isinstance(timestamp_str, str):
            ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        else:
            ts = timestamp_str
        return datetime.now(timezone.utc) - ts > timedelta(days=ttl_days)
    except Exception:
        return True


# ── Targets ──────────────────────────────────────────────────────────────

def get_cached_target(uniprot_id: str) -> dict | None:
    if not pool:
        return None
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM targets WHERE uniprot_id = %s", (uniprot_id,))
                row = cur.fetchone()
                if row and not _is_stale(row.get("resolved_at"), CACHE_TTL_DAYS):
                    # Format datetime -> ISO string for compatibility
                    if row.get("resolved_at"):
                        row["resolved_at"] = row["resolved_at"].isoformat()
                    return dict(row)
    except Exception:
        pass
    return None


def cache_target(target: dict) -> None:
    if not pool:
        return
    try:
        resolved_at = datetime.now(timezone.utc)
        query = """
            INSERT INTO targets (uniprot_id, name, gene_name, organism, sequence, length, structure_source, plddt_mean, resolved_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (uniprot_id) DO UPDATE SET
                name = EXCLUDED.name,
                gene_name = EXCLUDED.gene_name,
                organism = EXCLUDED.organism,
                sequence = EXCLUDED.sequence,
                length = EXCLUDED.length,
                structure_source = EXCLUDED.structure_source,
                plddt_mean = EXCLUDED.plddt_mean,
                resolved_at = EXCLUDED.resolved_at
        """
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (
                    target["uniprot_id"],
                    target["name"],
                    target.get("gene_name"),
                    target["organism"],
                    target["sequence"],
                    target["length"],
                    target.get("structure_source"),
                    target.get("plddt_mean"),
                    resolved_at
                ))
    except Exception as e:
        print(f"Error caching target: {e}")


# ── Pockets ──────────────────────────────────────────────────────────────

def get_cached_pockets(target_id: str) -> list[dict] | None:
    if not pool:
        return None
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM pockets WHERE target_id = %s ORDER BY rank", (target_id,))
                rows = cur.fetchall()
                if rows and not _is_stale(rows[0].get("predicted_at"), CACHE_TTL_DAYS):
                    for row in rows:
                        if isinstance(row.get("residues"), str):
                            row["residues"] = json.loads(row["residues"])
                        if row.get("predicted_at"):
                            row["predicted_at"] = row["predicted_at"].isoformat()
                    return [dict(r) for r in rows]
    except Exception:
        pass
    return None


def cache_pockets(target_id: str, pockets: list[dict]) -> None:
    if not pool:
        return
    try:
        predicted_at = datetime.now(timezone.utc)
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM pockets WHERE target_id = %s", (target_id,))
                if pockets:
                    query = """
                        INSERT INTO pockets (target_id, rank, score, druggability, center_x, center_y, center_z, residues, residue_count, predicted_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    data = []
                    for p in pockets:
                        data.append((
                            target_id,
                            p["rank"],
                            p["score"],
                            p["druggability"],
                            p["center_x"],
                            p["center_y"],
                            p["center_z"],
                            json.dumps(p["residues"]),
                            p["residue_count"],
                            predicted_at
                        ))
                    cur.executemany(query, data)
    except Exception as e:
        print(f"Error caching pockets: {e}")


# ── Ligands ──────────────────────────────────────────────────────────────

def get_cached_ligands(target_id: str) -> list[dict] | None:
    if not pool:
        return None
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM known_ligands WHERE target_id = %s ORDER BY activity_value_nm", (target_id,))
                rows = cur.fetchall()
                if rows and not _is_stale(rows[0].get("fetched_at"), CACHE_TTL_DAYS):
                    for row in rows:
                        if row.get("fetched_at"):
                            row["fetched_at"] = row["fetched_at"].isoformat()
                    return [dict(r) for r in rows]
    except Exception:
        pass
    return None


def cache_ligands(target_id: str, ligands: list[dict]) -> None:
    if not pool:
        return
    try:
        fetched_at = datetime.now(timezone.utc)
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM known_ligands WHERE target_id = %s", (target_id,))
                if ligands:
                    query = """
                        INSERT INTO known_ligands (target_id, chembl_id, name, smiles, activity_type, activity_value_nm, clinical_phase, clinical_phase_label, image_url, fetched_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    data = []
                    for lig in ligands:
                        data.append((
                            target_id,
                            lig.get("chembl_id"),
                            lig.get("name"),
                            lig.get("smiles", ""),
                            lig.get("activity_type"),
                            lig.get("activity_value_nm"),
                            lig.get("clinical_phase", 0),
                            lig.get("clinical_phase_label", "Preclinical"),
                            lig.get("image_url"),
                            fetched_at
                        ))
                    cur.executemany(query, data)
    except Exception as e:
        print(f"Error caching ligands: {e}")


# ── Predictions ──────────────────────────────────────────────────────────

def save_prediction(prediction: dict) -> None:
    if not pool:
        return
    try:
        query = """
            INSERT INTO complex_predictions (prediction_id, target_id, pocket_rank, ligand_name, ligand_smiles, ligand_ccd, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (prediction_id) DO UPDATE SET
                target_id = EXCLUDED.target_id,
                pocket_rank = EXCLUDED.pocket_rank,
                ligand_name = EXCLUDED.ligand_name,
                ligand_smiles = EXCLUDED.ligand_smiles,
                ligand_ccd = EXCLUDED.ligand_ccd,
                status = EXCLUDED.status,
                created_at = EXCLUDED.created_at
        """
        
        created_at = prediction.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        elif not created_at:
            created_at = datetime.now(timezone.utc)
            
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (
                    prediction["prediction_id"],
                    prediction.get("uniprot_id"),
                    prediction.get("pocket_rank"),
                    prediction.get("ligand_name"),
                    prediction.get("ligand_smiles"),
                    prediction.get("ligand_ccd"),
                    prediction.get("status", "prepared"),
                    created_at
                ))
    except Exception as e:
        print(f"Error saving prediction: {e}")


def update_prediction_status(prediction_id: str, status: str) -> None:
    if not pool:
        return
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE complex_predictions SET status = %s WHERE prediction_id = %s", (status, prediction_id))
    except Exception as e:
        print(f"Error updating prediction status: {e}")


def get_prediction(prediction_id: str) -> dict | None:
    if not pool:
        return None
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM complex_predictions WHERE prediction_id = %s", (prediction_id,))
                row = cur.fetchone()
                if row:
                    if row.get("created_at"):
                        row["created_at"] = row["created_at"].isoformat()
                    # Backwards compatibility key mapping
                    out = dict(row)
                    if "target_id" in out and out["target_id"]:
                        out["uniprot_id"] = out["target_id"]
                    return out
    except Exception:
        pass
    return None


def get_cached_ai_summary(target_id: str, summary_type: str = "pocket_analysis") -> str | None:
    if not pool:
        return None
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT summary, generated_at FROM ai_summaries WHERE target_id = %s AND summary_type = %s", (target_id, summary_type))
                row = cur.fetchone()
                if row:
                    if not _is_stale(row.get("generated_at"), AI_SUMMARY_TTL_DAYS):
                        return row.get("summary")
    except Exception:
        pass
    return None


def cache_ai_summary(target_id: str, summary: str, summary_type: str = "pocket_analysis") -> None:
    if not pool:
        return
    try:
        generated_at = datetime.now(timezone.utc)
        query = """
            INSERT INTO ai_summaries (target_id, summary_type, summary, generated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (target_id, summary_type) DO UPDATE SET
                summary = EXCLUDED.summary,
                generated_at = EXCLUDED.generated_at
        """
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (target_id, summary_type, summary, generated_at))
    except Exception as e:
        print(f"Error caching ai summary: {e}")


def get_predictions_for_target(uniprot_id: str) -> list[dict]:
    if not pool:
        return []
    try:
        with pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM complex_predictions WHERE target_id = %s ORDER BY created_at DESC", (uniprot_id,))
                rows = cur.fetchall()
                for row in rows:
                    if row.get("created_at"):
                        row["created_at"] = row["created_at"].isoformat()
                    if "target_id" in row and row["target_id"]:
                        row["uniprot_id"] = row["target_id"]
                return [dict(r) for r in rows]
    except Exception:
        return []
