import asyncio
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from contextlib import asynccontextmanager

import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import torch

from jobs import create_job, get_job, update_job, pop_next_job, get_redis

BOLTZ_CACHE = Path(os.environ.get("BOLTZ_CACHE", "/app/.boltz_cache"))
BOLTZ_CACHE.mkdir(parents=True, exist_ok=True)

MAX_CONCURRENT = int(os.environ.get("BOLTZ_MAX_CONCURRENT", "1"))


class AffinityRequest(BaseModel):
    protein_sequence: str = Field(..., description="Single-letter amino acid sequence")
    ligand_smiles: str = Field(..., description="SMILES of the small molecule")
    ligand_name: str | None = None
    uniprot_id: str | None = None
    use_msa_server: bool = True


class BatchAffinityRequest(BaseModel):
    protein_sequence: str
    uniprot_id: str | None = None
    ligands: list[dict]
    use_msa_server: bool = True


async def run_boltz_prediction(job_id: str):
    """Core inference: build YAML, call boltz predict, parse output."""
    job = await get_job(job_id)
    if not job:
        return

    payload = job["payload"]
    await update_job(
        job_id,
        status="running",
        started_at=asyncio.get_event_loop().time(),
        progress=5,
    )

    work_dir = Path(tempfile.mkdtemp(prefix=f"boltz_{job_id}_"))
    try:
        yaml_path = work_dir / "input.yaml"
        yaml_doc = {
            "version": 1,
            "sequences": [
                {"protein": {"id": "A", "sequence": payload["protein_sequence"]}},
                {"ligand": {"id": "B", "smiles": payload["ligand_smiles"]}},
            ],
            "properties": [{"affinity": {"binder": "B"}}],
        }
        yaml_path.write_text(yaml.safe_dump(yaml_doc, sort_keys=False))

        await update_job(job_id, progress=15)

        out_dir = work_dir / "out"
        cmd = [
            "boltz", "predict", str(yaml_path),
            "--out_dir", str(out_dir),
            "--cache", str(BOLTZ_CACHE),
            "--output_format", "mmcif",
            "--accelerator", "cpu" if not torch.cuda.is_available() else "gpu",
        ]
        if payload.get("use_msa_server", True):
            cmd.append("--use_msa_server")

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(work_dir),
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            err = stderr.decode(errors="ignore")[-2000:]
            if "Molecule is excluded" in err:
                raise ValueError(
                    "Boltz cannot standardize this SMILES (likely contains a metal atom or unusual element). "
                    "Try a different molecule or use a CCD code."
                )
            raise RuntimeError(f"boltz predict failed: {err}")

        await update_job(job_id, progress=85)

        affinity_files = list(out_dir.rglob("affinity_*.json"))
        if not affinity_files:
            raise RuntimeError(
                "No affinity output produced. Check that the YAML included a properties.affinity block."
            )

        affinity_data = json.loads(affinity_files[0].read_text())

        cif_files = list(out_dir.rglob("*_model_0.cif"))
        structure_cif = cif_files[0].read_text() if cif_files else None

        confidence_files = list(out_dir.rglob("confidence_*.json"))
        confidence_data = (
            json.loads(confidence_files[0].read_text()) if confidence_files else {}
        )

        log_ic50_um = affinity_data.get("affinity_pred_value")
        # pIC50 = 6 - log10(IC50_uM)
        pic50 = (6.0 - log_ic50_um) if log_ic50_um is not None else None
        ic50_nm = (1000.0 * (10 ** log_ic50_um)) if log_ic50_um is not None else None

        result = {
            "affinity_pred_value": log_ic50_um,
            "affinity_probability_binary": affinity_data.get("affinity_probability_binary"),
            "pic50": round(pic50, 2) if pic50 is not None else None,
            "ic50_nm": round(ic50_nm, 2) if ic50_nm is not None else None,
            "complex_cif": structure_cif,
            "confidence": {
                "ptm": confidence_data.get("ptm"),
                "iptm": confidence_data.get("iptm"),
                "plddt": confidence_data.get("complex_plddt"),
            },
        }

        await update_job(
            job_id,
            status="complete",
            completed_at=asyncio.get_event_loop().time(),
            progress=100,
            result=result,
        )

    except Exception as e:
        await update_job(
            job_id,
            status="failed",
            completed_at=asyncio.get_event_loop().time(),
            error=str(e),
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


async def worker_loop():
    """Background worker: pulls jobs off the queue and runs them."""
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    while True:
        job_id = await pop_next_job()
        if job_id is None:
            await asyncio.sleep(1)
            continue

        async def _run(jid):
            async with sem:
                await run_boltz_prediction(jid)

        asyncio.create_task(_run(job_id))


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(worker_loop())
    yield
    task.cancel()


app = FastAPI(title="OpenDDE Boltz-2 Service", lifespan=lifespan)


@app.get("/health")
async def health():
    r = await get_redis()
    depth = await r.llen("boltz:queue")
    return {
        "status": "ok",
        "torch_device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_cache_exists": any(BOLTZ_CACHE.iterdir()) if BOLTZ_CACHE.exists() else False,
        "queue_depth": depth,
        "max_concurrent": MAX_CONCURRENT,
    }


@app.post("/predict-affinity")
async def predict_affinity(req: AffinityRequest):
    job_id = await create_job(req.model_dump())
    return {"job_id": job_id, "status": "queued"}


@app.post("/predict-affinity/batch")
async def predict_batch(req: BatchAffinityRequest):
    job_ids = []
    for lig in req.ligands:
        payload = {
            "protein_sequence": req.protein_sequence,
            "uniprot_id": req.uniprot_id,
            "ligand_smiles": lig["smiles"],
            "ligand_name": lig.get("name"),
            "ligand_external_id": lig.get("external_id"),
            "use_msa_server": req.use_msa_server,
        }
        jid = await create_job(payload)
        job_ids.append(jid)
    return {"job_ids": job_ids, "count": len(job_ids)}


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found or expired")
    return job


@app.get("/jobs")
async def list_jobs(limit: int = 50):
    r = await get_redis()
    keys = []
    cursor = 0
    while True:
        cursor, batch = await r.scan(cursor=cursor, match=f"boltz:job:*", count=100)
        keys.extend(batch)
        if cursor == 0 or len(keys) >= limit * 4:
            break
    jobs = []
    for k in keys[: limit * 4]:
        raw = await r.get(k)
        if raw:
            jobs.append(json.loads(raw))
    jobs.sort(key=lambda j: j.get("created_at") or 0, reverse=True)
    return {"jobs": jobs[:limit], "count": len(jobs[:limit])}
