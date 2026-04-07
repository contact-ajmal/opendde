import io
import json
import os
import uuid
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel

from engines.af3_builder import AF3JobBuilder
from services.uniprot import resolve_target
from services.database import (
    save_prediction,
    update_prediction_status,
    get_prediction as db_get_prediction,
    get_predictions_for_target,
)

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")
COMPLEXES_DIR = os.path.join(STRUCTURE_DIR, "complexes")

router = APIRouter()

# In-memory fallback for when Supabase is not configured
_predictions: dict[str, dict] = {}


class PrepareRequest(BaseModel):
    uniprot_id: str
    ligand_smiles: str | None = None
    ligand_ccd: str | None = None
    ligand_name: str | None = None


def _store_prediction(pred: dict):
    _predictions[pred["prediction_id"]] = pred
    save_prediction(pred)


def _get_prediction(prediction_id: str) -> dict | None:
    if prediction_id in _predictions:
        return _predictions[prediction_id]
    row = db_get_prediction(prediction_id)
    if row:
        # Reconstruct the full prediction dict
        pred = {
            "prediction_id": row["prediction_id"],
            "uniprot_id": row.get("target_id"),
            "ligand_name": row.get("ligand_name"),
            "ligand_smiles": row.get("ligand_smiles"),
            "ligand_ccd": row.get("ligand_ccd"),
            "status": row.get("status", "prepared"),
            "structure_url": None,
            "created_at": row.get("created_at"),
        }
        if pred["status"] == "complete":
            pred["structure_url"] = f"/api/v1/structures/complexes/{prediction_id}.cif"
        _predictions[prediction_id] = pred
        return pred
    return None


@router.post("/complex/prepare")
async def prepare_complex(req: PrepareRequest):
    target = await resolve_target(req.uniprot_id)

    job_name = f"opendde_{target.gene_name or target.uniprot_id}"
    if req.ligand_name:
        job_name += f"_{req.ligand_name}"

    job_json = AF3JobBuilder.build_job(
        protein_sequence=target.sequence,
        ligand_ccd=req.ligand_ccd,
        ligand_smiles=req.ligand_smiles,
        job_name=job_name,
    )

    prediction_id = str(uuid.uuid4())
    pred = {
        "prediction_id": prediction_id,
        "uniprot_id": req.uniprot_id,
        "ligand_name": req.ligand_name,
        "ligand_smiles": req.ligand_smiles,
        "ligand_ccd": req.ligand_ccd,
        "job_json": job_json,
        "status": "prepared",
        "structure_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _store_prediction(pred)

    return {
        "prediction_id": prediction_id,
        "job_json": job_json,
        "job_json_pretty": json.dumps(job_json, indent=2),
        "alphafold_server_url": "https://alphafoldserver.com/",
        "instructions": [
            "1. Copy the JSON below",
            "2. Go to alphafoldserver.com and sign in",
            "3. Click 'New job' → 'Import JSON' and paste",
            "4. Submit the job and wait for results",
            "5. Download the result CIF/ZIP and upload it here",
        ],
    }


@router.post("/complex/upload")
async def upload_complex(
    file: UploadFile = File(...),
    prediction_id: str = Form(...),
):
    pred = _get_prediction(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    os.makedirs(COMPLEXES_DIR, exist_ok=True)
    cif_path = os.path.join(COMPLEXES_DIR, f"{prediction_id}.cif")

    content = await file.read()

    if file.filename and file.filename.endswith(".zip"):
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            cif_names = [n for n in zf.namelist() if n.endswith(".cif")]
            if not cif_names:
                raise HTTPException(status_code=400, detail="No CIF file found in ZIP")
            with open(cif_path, "wb") as f:
                f.write(zf.read(cif_names[0]))
    else:
        with open(cif_path, "wb") as f:
            f.write(content)

    structure_url = f"/api/v1/structures/complexes/{prediction_id}.cif"
    pred["status"] = "complete"
    pred["structure_url"] = structure_url
    update_prediction_status(prediction_id, "complete")

    return {
        "prediction_id": prediction_id,
        "structure_url": structure_url,
        "status": "complete",
    }


@router.get("/complex/{prediction_id}")
async def get_prediction_endpoint(prediction_id: str):
    pred = _get_prediction(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return pred


@router.get("/target/{uniprot_id}/predictions")
async def get_target_predictions(uniprot_id: str):
    # Merge in-memory and DB results
    db_preds = get_predictions_for_target(uniprot_id)
    mem_preds = [p for p in _predictions.values() if p.get("uniprot_id") == uniprot_id]

    # Deduplicate by prediction_id, preferring in-memory (more current)
    seen = set()
    results = []
    for p in mem_preds:
        if p["prediction_id"] not in seen:
            seen.add(p["prediction_id"])
            results.append(p)
    for row in db_preds:
        pid = row.get("prediction_id")
        if pid and pid not in seen:
            seen.add(pid)
            pred = {
                "prediction_id": pid,
                "uniprot_id": row.get("target_id"),
                "ligand_name": row.get("ligand_name"),
                "ligand_smiles": row.get("ligand_smiles"),
                "ligand_ccd": row.get("ligand_ccd"),
                "status": row.get("status", "prepared"),
                "structure_url": f"/api/v1/structures/complexes/{pid}.cif" if row.get("status") == "complete" else None,
                "created_at": row.get("created_at"),
            }
            results.append(pred)

    return {"uniprot_id": uniprot_id, "predictions": results}


@router.head("/structures/complexes/{filename}")
@router.get("/structures/complexes/{filename}")
async def serve_complex_structure(filename: str):
    filepath = os.path.join(COMPLEXES_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Complex structure file not found")
    return FileResponse(filepath, media_type="chemical/x-cif", filename=filename)
