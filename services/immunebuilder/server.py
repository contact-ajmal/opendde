import os
import re
import uuid

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="ImmuneBuilder Service")

ANTIBODIES_DIR = "/data/antibodies"
VALID_AA = set("ACDEFGHIKLMNPQRSTVWY")

# Chothia CDR definitions
CDR_REGIONS = [
    {"name": "H1", "start": 26, "end": 32, "chain": "H"},
    {"name": "H2", "start": 52, "end": 56, "chain": "H"},
    {"name": "H3", "start": 95, "end": 102, "chain": "H"},
    {"name": "L1", "start": 24, "end": 34, "chain": "L"},
    {"name": "L2", "start": 50, "end": 56, "chain": "L"},
    {"name": "L3", "start": 89, "end": 97, "chain": "L"},
]


class PredictRequest(BaseModel):
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


@app.post("/predict")
async def predict(req: PredictRequest):
    heavy = validate_sequence(req.heavy_chain, "heavy chain")
    light = validate_sequence(req.light_chain, "light chain")

    os.makedirs(ANTIBODIES_DIR, exist_ok=True)
    pdb_filename = f"ab_{uuid.uuid4().hex[:12]}.pdb"
    pdb_path = os.path.join(ANTIBODIES_DIR, pdb_filename)

    try:
        from ImmuneBuilder import ABodyBuilder2

        predictor = ABodyBuilder2()
        antibody = predictor.predict(
            {"H": heavy, "L": light}
        )
        antibody.save(pdb_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    cdr_regions = []
    for cdr in CDR_REGIONS:
        residues = list(range(cdr["start"], cdr["end"] + 1))
        cdr_regions.append({
            "name": cdr["name"],
            "residues": residues,
            "chain": cdr["chain"],
            "length": len(residues),
        })

    return {
        "pdb_filename": pdb_filename,
        "cdr_regions": cdr_regions,
        "heavy_length": len(heavy),
        "light_length": len(light),
    }


@app.get("/health")
async def health():
    try:
        from ImmuneBuilder import ABodyBuilder2
        return {"status": "ok", "immunebuilder_available": True}
    except ImportError:
        return {"status": "ok", "immunebuilder_available": False}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
