import httpx

from config import settings


async def get_properties(smiles: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.RDKIT_SERVICE_URL}/properties",
            json={"smiles": smiles},
        )
        resp.raise_for_status()
        return resp.json()


async def get_batch_properties(smiles_list: list[str]) -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{settings.RDKIT_SERVICE_URL}/batch_properties",
            json={"smiles_list": smiles_list},
        )
        resp.raise_for_status()
        return resp.json()


async def get_similarity(smiles_a: str, smiles_b: str) -> float:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.RDKIT_SERVICE_URL}/similarity",
            json={"smiles_a": smiles_a, "smiles_b": smiles_b},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["tanimoto_similarity"]
