from urllib.parse import unquote

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engines.rdkit_client import get_properties, get_batch_properties

router = APIRouter()


class BatchRequest(BaseModel):
    smiles_list: list[str]


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
