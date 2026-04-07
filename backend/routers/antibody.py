import os
import re

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import settings

ANTIBODIES_DIR = "/data/antibodies"
VALID_AA = set("ACDEFGHIKLMNPQRSTVWY")

router = APIRouter()


class AntibodyPredictRequest(BaseModel):
    heavy_chain: str
    light_chain: str


def validate_sequence(seq: str, name: str) -> str:
    seq = seq.strip().upper()
    seq = re.sub(r"\s+", "", seq)
    invalid = set(seq) - VALID_AA
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid amino acids in {name}: {', '.join(sorted(invalid))}",
        )
    if len(seq) < 50 or len(seq) > 300:
        raise HTTPException(
            status_code=400,
            detail=f"{name} must be 50-300 amino acids, got {len(seq)}",
        )
    return seq


@router.post("/antibody/predict")
async def predict_antibody(req: AntibodyPredictRequest):
    heavy = validate_sequence(req.heavy_chain, "heavy chain")
    light = validate_sequence(req.light_chain, "light chain")

    async with httpx.AsyncClient(timeout=300.0) as client:
        resp = await client.post(
            f"{settings.IMMUNEBUILDER_SERVICE_URL}/predict",
            json={"heavy_chain": heavy, "light_chain": light},
        )
        if resp.status_code != 200:
            detail = resp.text
            raise HTTPException(status_code=resp.status_code, detail=detail)
        data = resp.json()

    return {
        "pdb_url": f"/api/v1/antibody/structures/{data['pdb_filename']}",
        "cdr_regions": data["cdr_regions"],
        "heavy_length": data["heavy_length"],
        "light_length": data["light_length"],
    }


@router.head("/antibody/structures/{filename}")
@router.get("/antibody/structures/{filename}")
async def serve_antibody_structure(filename: str):
    filepath = os.path.join(ANTIBODIES_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Antibody structure not found")
    return FileResponse(filepath, media_type="chemical/x-pdb", filename=filename)
