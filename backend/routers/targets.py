import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from models.schemas import TargetResolveRequest, TargetInfo
from services.uniprot import resolve_target
from services.alphafold import fetch_structure
from services.database import get_cached_target, cache_target

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")

router = APIRouter()


@router.post("/target/resolve", response_model=TargetInfo)
async def resolve(req: TargetResolveRequest):
    # Check Supabase cache first
    cached = get_cached_target(req.query)
    if cached:
        target = TargetInfo(
            uniprot_id=cached["uniprot_id"],
            name=cached["name"],
            gene_name=cached.get("gene_name"),
            organism=cached["organism"],
            sequence=cached["sequence"],
            length=cached["length"],
            structure_source=cached.get("structure_source"),
            structure_url=f"/api/v1/structures/{cached['uniprot_id']}.cif" if cached.get("structure_source") else None,
            plddt_mean=cached.get("plddt_mean"),
        )
        # Ensure structure file exists locally
        filepath = os.path.join(STRUCTURE_DIR, f"{target.uniprot_id}.cif")
        if target.structure_source and not os.path.isfile(filepath):
            await fetch_structure(target.uniprot_id)
        return target

    # Resolve from UniProt API
    target = await resolve_target(req.query)

    structure = await fetch_structure(target.uniprot_id)
    if structure:
        target.structure_source = structure["source"]
        target.structure_url = f"/api/v1/structures/{target.uniprot_id}.cif"
        target.plddt_mean = structure.get("plddt_mean")

    # Cache in Supabase
    cache_target(target.model_dump())

    return target


@router.head("/structures/{filename}")
@router.get("/structures/{filename}")
async def serve_structure(filename: str):
    filepath = os.path.join(STRUCTURE_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Structure file not found")
    return FileResponse(
        filepath,
        media_type="chemical/x-cif",
        filename=filename,
        headers={"Cache-Control": "public, max-age=86400"},
    )
