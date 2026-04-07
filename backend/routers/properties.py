from urllib.parse import unquote

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from config import settings
from engines.rdkit_client import get_properties, get_batch_properties

router = APIRouter()


class BatchRequest(BaseModel):
    smiles_list: list[str]


class SmilesRequest(BaseModel):
    smiles: str


@router.get("/properties/{smiles_encoded}")
async def properties_single(smiles_encoded: str):
    smiles = unquote(smiles_encoded)
    try:
        return await get_properties(smiles)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/properties/batch")
async def properties_batch(body: BatchRequest):
    try:
        return await get_batch_properties(body.smiles_list)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate")
async def validate_smiles(body: SmilesRequest):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.RDKIT_SERVICE_URL}/validate",
                json={"smiles": body.smiles},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/depict")
async def depict_smiles(body: SmilesRequest):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.RDKIT_SERVICE_URL}/depict",
                json={"smiles": body.smiles, "width": 300, "height": 200},
            )
            resp.raise_for_status()
            return Response(content=resp.content, media_type="image/png")
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to depict molecule")
