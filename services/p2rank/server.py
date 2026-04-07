import asyncio
import csv
import glob
import os
import shutil
import tempfile

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="P2Rank Service")

P2RANK_PATH = "/app/p2rank/prank"
STRUCTURES_DIR = "/data/structures"


class PredictRequest(BaseModel):
    structure_filename: str


@app.post("/predict")
async def predict(req: PredictRequest):
    structure_path = os.path.join(STRUCTURES_DIR, req.structure_filename)
    if not os.path.isfile(structure_path):
        raise HTTPException(status_code=404, detail=f"Structure file not found: {req.structure_filename}")

    tmpdir = tempfile.mkdtemp(prefix="p2rank_")
    try:
        cmd = [
            P2RANK_PATH, "predict",
            "-f", structure_path,
            "-o", tmpdir,
            "-c", "alphafold",
            "-visualizations", "0",
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        except asyncio.TimeoutError:
            proc.kill()
            raise HTTPException(status_code=504, detail="P2Rank prediction timed out")

        if proc.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"P2Rank failed (exit {proc.returncode}): {stderr.decode()[-500:]}"
            )

        # Find the predictions CSV
        csv_files = glob.glob(os.path.join(tmpdir, "**/*_predictions.csv"), recursive=True)
        if not csv_files:
            raise HTTPException(status_code=500, detail="No predictions CSV found in P2Rank output")

        pockets = []
        with open(csv_files[0], newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Strip leading spaces from column names
                row = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()}

                score = float(row.get("score", 0))
                prob = float(row.get("probability", 0))
                if prob == 0:
                    prob = min(score / 20.0, 1.0)

                residue_ids_raw = row.get("residue_ids", "")
                residues = residue_ids_raw.split() if residue_ids_raw else []

                pockets.append({
                    "rank": int(row.get("rank", 0)),
                    "score": round(score, 3),
                    "center_x": round(float(row.get("center_x", 0)), 3),
                    "center_y": round(float(row.get("center_y", 0)), 3),
                    "center_z": round(float(row.get("center_z", 0)), 3),
                    "residues": residues,
                    "residue_count": len(residues),
                    "druggability": round(prob, 3),
                })

        return {"pocket_count": len(pockets), "pockets": pockets}

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.get("/health")
async def health():
    return {"status": "ok", "p2rank_found": os.path.isfile(P2RANK_PATH)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
