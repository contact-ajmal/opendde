import httpx

from config import settings
from models.schemas import PocketResult


class P2RankEngine:
    def __init__(self):
        self.base_url = settings.P2RANK_SERVICE_URL

    async def predict(self, structure_filename: str) -> list[PocketResult]:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(
                f"{self.base_url}/predict",
                json={"structure_filename": structure_filename},
            )
            resp.raise_for_status()
            data = resp.json()

            return [
                PocketResult(
                    rank=p["rank"],
                    score=p["score"],
                    center_x=p["center_x"],
                    center_y=p["center_y"],
                    center_z=p["center_z"],
                    residues=p["residues"],
                    residue_count=p["residue_count"],
                    druggability=p["druggability"],
                )
                for p in data["pockets"]
            ]
