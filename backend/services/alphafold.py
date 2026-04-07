import os

import httpx

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")


async def fetch_structure(uniprot_id: str) -> dict | None:
    cif_path = os.path.join(STRUCTURE_DIR, f"{uniprot_id}.cif")

    if os.path.isfile(cif_path):
        return {"local_path": cif_path, "source": "alphafold_db", "plddt_mean": None}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"https://alphafold.ebi.ac.uk/api/prediction/{uniprot_id}"
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()

        predictions = resp.json()
        if not predictions:
            return None

        prediction = predictions[0]
        cif_url = prediction.get("cifUrl")
        plddt_mean = prediction.get("globalMetricValue")

        if not cif_url:
            return None

        cif_resp = await client.get(cif_url)
        cif_resp.raise_for_status()

        os.makedirs(STRUCTURE_DIR, exist_ok=True)
        with open(cif_path, "wb") as f:
            f.write(cif_resp.content)

        return {"local_path": cif_path, "source": "alphafold_db", "plddt_mean": plddt_mean}
