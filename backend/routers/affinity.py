import json
import uuid

from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel

from engines.boltz import BoltzEngine
from services import database
from services.uniprot import resolve_target

router = APIRouter()
boltz = BoltzEngine()


class SubmitSingleRequest(BaseModel):
    uniprot_id: str
    ligand_smiles: str
    ligand_name: str | None = None
    ligand_external_id: str | None = None


class SubmitBatchRequest(BaseModel):
    uniprot_id: str
    pocket_rank: int | None = None
    campaign_name: str | None = None
    ligands: list[dict]


def _require_pool():
    if database.pool is None:
        raise HTTPException(503, "Database not configured")
    return database.pool


def _serialize_prediction(row: dict) -> dict:
    d = dict(row)
    if isinstance(d.get("confidence"), str):
        d["confidence"] = json.loads(d["confidence"])
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    if d.get("completed_at"):
        d["completed_at"] = d["completed_at"].isoformat()
    return d


@router.get("/affinity/health")
async def health():
    return await boltz.health()


@router.post("/affinity/predict")
async def predict_single(req: SubmitSingleRequest):
    target = await resolve_target(req.uniprot_id)
    pool = _require_pool()

    # Dedupe: if we already have an active or completed prediction for this exact
    # (uniprot_id, ligand_smiles), return its job_id instead of resubmitting.
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT job_id FROM affinity_predictions
                WHERE uniprot_id = %s
                  AND ligand_smiles = %s
                  AND status IN ('queued', 'running', 'complete')
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (req.uniprot_id, req.ligand_smiles),
            )
            existing = cur.fetchone()
            if existing:
                return {"job_id": existing["job_id"], "cached": True}

    job_id = await boltz.submit(
        protein_sequence=target.sequence,
        ligand_smiles=req.ligand_smiles,
        uniprot_id=req.uniprot_id,
        ligand_name=req.ligand_name,
    )

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO affinity_predictions
                  (job_id, uniprot_id, ligand_smiles, ligand_name, ligand_external_id, status)
                VALUES (%s, %s, %s, %s, %s, 'queued')
                """,
                (
                    job_id,
                    req.uniprot_id,
                    req.ligand_smiles,
                    req.ligand_name,
                    req.ligand_external_id,
                ),
            )

    return {"job_id": job_id, "cached": False}


@router.post("/affinity/screen")
async def screen_batch(req: SubmitBatchRequest):
    if not req.ligands:
        raise HTTPException(400, "ligands must be non-empty")
    if len(req.ligands) > 1000:
        raise HTTPException(400, "max 1000 ligands per campaign")

    target = await resolve_target(req.uniprot_id)
    pool = _require_pool()
    campaign_id = uuid.uuid4()
    campaign_name = req.campaign_name or f"Screen vs {req.uniprot_id}"

    job_ids = await boltz.submit_batch(
        protein_sequence=target.sequence,
        uniprot_id=req.uniprot_id,
        ligands=req.ligands,
    )

    with pool.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO screening_campaigns
                      (id, uniprot_id, pocket_rank, name, total_ligands)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        campaign_id,
                        req.uniprot_id,
                        req.pocket_rank,
                        campaign_name,
                        len(req.ligands),
                    ),
                )

                pred_rows = [
                    (
                        jid,
                        req.uniprot_id,
                        lig["smiles"],
                        lig.get("name"),
                        lig.get("external_id"),
                        "queued",
                    )
                    for jid, lig in zip(job_ids, req.ligands)
                ]
                cur.executemany(
                    """
                    INSERT INTO affinity_predictions
                      (job_id, uniprot_id, ligand_smiles, ligand_name,
                       ligand_external_id, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    pred_rows,
                )

                map_rows = [
                    (campaign_id, jid, lig.get("name"), lig["smiles"])
                    for jid, lig in zip(job_ids, req.ligands)
                ]
                cur.executemany(
                    """
                    INSERT INTO screening_job_map
                      (campaign_id, job_id, ligand_name, ligand_smiles)
                    VALUES (%s, %s, %s, %s)
                    """,
                    map_rows,
                )

    return {"campaign_id": str(campaign_id), "job_count": len(job_ids)}


@router.get("/affinity/job/{job_id}")
async def job_status(job_id: str):
    """Poll the boltz service, then sync the result back to Postgres so it persists."""
    status = await boltz.status(job_id)

    if status.get("status") in ("complete", "failed"):
        pool = _require_pool()
        with pool.connection() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    if status["status"] == "complete":
                        result = status.get("result") or {}
                        confidence = result.get("confidence")
                        confidence_json = (
                            json.dumps(confidence) if confidence is not None else None
                        )

                        # RETURNING tells us whether this poll was the first
                        # transition — only then do we bump the campaign counter.
                        cur.execute(
                            """
                            UPDATE affinity_predictions
                            SET status = 'complete',
                                affinity_pred_value = %s,
                                affinity_probability_binary = %s,
                                pic50 = %s,
                                ic50_nm = %s,
                                confidence = %s::jsonb,
                                completed_at = NOW()
                            WHERE job_id = %s AND status != 'complete'
                            RETURNING 1
                            """,
                            (
                                result.get("affinity_pred_value"),
                                result.get("affinity_probability_binary"),
                                result.get("pic50"),
                                result.get("ic50_nm"),
                                confidence_json,
                                job_id,
                            ),
                        )
                        transitioned = cur.fetchone() is not None

                        if transitioned:
                            cur.execute(
                                """
                                UPDATE screening_campaigns sc
                                SET completed_count = completed_count + 1,
                                    completed_at = CASE
                                      WHEN completed_count + 1 + failed_count >= total_ligands
                                        THEN NOW()
                                      ELSE completed_at
                                    END
                                FROM screening_job_map m
                                WHERE m.campaign_id = sc.id
                                  AND m.job_id = %s
                                """,
                                (job_id,),
                            )
                    else:  # failed
                        cur.execute(
                            """
                            UPDATE affinity_predictions
                            SET status = 'failed',
                                error = %s,
                                completed_at = NOW()
                            WHERE job_id = %s AND status != 'failed'
                            RETURNING 1
                            """,
                            (status.get("error"), job_id),
                        )
                        transitioned = cur.fetchone() is not None

                        if transitioned:
                            cur.execute(
                                """
                                UPDATE screening_campaigns sc
                                SET failed_count = failed_count + 1,
                                    completed_at = CASE
                                      WHEN completed_count + failed_count + 1 >= total_ligands
                                        THEN NOW()
                                      ELSE completed_at
                                    END
                                FROM screening_job_map m
                                WHERE m.campaign_id = sc.id
                                  AND m.job_id = %s
                                """,
                                (job_id,),
                            )

    return status


@router.get("/affinity/target/{uniprot_id}")
async def list_predictions(uniprot_id: str, limit: int = 200):
    pool = _require_pool()
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT job_id, uniprot_id, ligand_smiles, ligand_name,
                       ligand_external_id, status, affinity_pred_value,
                       affinity_probability_binary, pic50, ic50_nm,
                       confidence, error, created_at, completed_at, engine
                FROM affinity_predictions
                WHERE uniprot_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (uniprot_id, limit),
            )
            rows = cur.fetchall()

    return {"predictions": [_serialize_prediction(r) for r in rows]}


@router.get("/affinity/campaign/{campaign_id}")
async def campaign_status(campaign_id: str):
    try:
        cid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(400, "Invalid campaign_id")

    pool = _require_pool()
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT id, uniprot_id, pocket_rank, name, total_ligands,
                       completed_count, failed_count, created_at, completed_at
                FROM screening_campaigns WHERE id = %s
                """,
                (cid,),
            )
            camp = cur.fetchone()
            if not camp:
                raise HTTPException(404, "Campaign not found")

            cur.execute(
                """
                SELECT p.job_id, p.uniprot_id, p.ligand_smiles, p.ligand_name,
                       p.ligand_external_id, p.status, p.affinity_pred_value,
                       p.affinity_probability_binary, p.pic50, p.ic50_nm,
                       p.confidence, p.error, p.created_at, p.completed_at
                FROM affinity_predictions p
                JOIN screening_job_map m ON m.job_id = p.job_id
                WHERE m.campaign_id = %s
                ORDER BY p.pic50 DESC NULLS LAST, p.created_at ASC
                """,
                (cid,),
            )
            preds = cur.fetchall()

    campaign = dict(camp)
    campaign["id"] = str(campaign["id"])
    if campaign.get("created_at"):
        campaign["created_at"] = campaign["created_at"].isoformat()
    if campaign.get("completed_at"):
        campaign["completed_at"] = campaign["completed_at"].isoformat()

    return {
        "campaign": campaign,
        "completed_count": campaign["completed_count"],
        "failed_count": campaign["failed_count"],
        "predictions": [_serialize_prediction(r) for r in preds],
    }
