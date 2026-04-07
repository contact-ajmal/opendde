import json
import os
import uuid
import zipfile
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel

from engines.af3_builder import AF3JobBuilder
from services.uniprot import resolve_target

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")
COMPLEXES_DIR = os.path.join(STRUCTURE_DIR, "complexes")

router = APIRouter()

# In-memory store
_predictions: dict[str, dict] = {}


class PrepareRequest(BaseModel):
    uniprot_id: str
    ligand_smiles: str | None = None
    ligand_ccd: str | None = None
    ligand_name: str | None = None


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
    _predictions[prediction_id] = {
        "prediction_id": prediction_id,
        "uniprot_id": req.uniprot_id,
        "ligand_name": req.ligand_name,
        "ligand_smiles": req.ligand_smiles,
        "ligand_ccd": req.ligand_ccd,
        "job_json": job_json,
        "status": "prepared",
        "structure_url": None,
        "created_at": datetime.utcnow().isoformat(),
    }

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
    if prediction_id not in _predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")

    os.makedirs(COMPLEXES_DIR, exist_ok=True)
    cif_path = os.path.join(COMPLEXES_DIR, f"{prediction_id}.cif")

    content = await file.read()

    if file.filename and file.filename.endswith(".zip"):
        # Extract CIF from ZIP
        import io
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
    _predictions[prediction_id]["status"] = "complete"
    _predictions[prediction_id]["structure_url"] = structure_url

    return {
        "prediction_id": prediction_id,
        "structure_url": structure_url,
        "status": "complete",
    }


@router.get("/complex/{prediction_id}")
async def get_prediction(prediction_id: str):
    if prediction_id not in _predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return _predictions[prediction_id]


@router.get("/target/{uniprot_id}/predictions")
async def get_target_predictions(uniprot_id: str):
    results = [p for p in _predictions.values() if p["uniprot_id"] == uniprot_id]
    return {"uniprot_id": uniprot_id, "predictions": results}


@router.head("/structures/complexes/{filename}")
@router.get("/structures/complexes/{filename}")
async def serve_complex_structure(filename: str):
    filepath = os.path.join(COMPLEXES_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Complex structure file not found")
    return FileResponse(filepath, media_type="chemical/x-cif", filename=filename)
