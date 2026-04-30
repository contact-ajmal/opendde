import httpx

from config import settings


class BoltzEngine:
    def __init__(self, base_url: str | None = None, timeout: float = 30.0):
        self.base_url = base_url or settings.BOLTZ_SERVICE_URL
        self.timeout = timeout

    async def health(self) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r = await c.get(f"{self.base_url}/health")
            r.raise_for_status()
            return r.json()

    async def submit(
        self,
        protein_sequence: str,
        ligand_smiles: str,
        uniprot_id: str | None = None,
        ligand_name: str | None = None,
    ) -> str:
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r = await c.post(
                f"{self.base_url}/predict-affinity",
                json={
                    "protein_sequence": protein_sequence,
                    "ligand_smiles": ligand_smiles,
                    "uniprot_id": uniprot_id,
                    "ligand_name": ligand_name,
                },
            )
            r.raise_for_status()
            return r.json()["job_id"]

    async def submit_batch(
        self,
        protein_sequence: str,
        ligands: list[dict],
        uniprot_id: str | None = None,
    ) -> list[str]:
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r = await c.post(
                f"{self.base_url}/predict-affinity/batch",
                json={
                    "protein_sequence": protein_sequence,
                    "uniprot_id": uniprot_id,
                    "ligands": ligands,
                },
            )
            r.raise_for_status()
            return r.json()["job_ids"]

    async def status(self, job_id: str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r = await c.get(f"{self.base_url}/jobs/{job_id}")
            if r.status_code == 404:
                return {"status": "expired", "id": job_id}
            r.raise_for_status()
            return r.json()
