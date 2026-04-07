import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from models.schemas import TargetResolveRequest, TargetInfo
from services.uniprot import resolve_target
from services.alphafold import fetch_structure

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")

router = APIRouter()


@router.post("/target/resolve", response_model=TargetInfo)
async def resolve(req: TargetResolveRequest):
    target = await resolve_target(req.query)

    structure = await fetch_structure(target.uniprot_id)
    if structure:
        target.structure_source = structure["source"]
        target.structure_url = f"/api/v1/structures/{target.uniprot_id}.cif"
        target.plddt_mean = structure.get("plddt_mean")

    return target


@router.head("/structures/{filename}")
@router.get("/structures/{filename}")
async def serve_structure(filename: str):
    filepath = os.path.join(STRUCTURE_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Structure file not found")
    return FileResponse(filepath, media_type="chemical/x-cif", filename=filename)
