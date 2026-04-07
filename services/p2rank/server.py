import os

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="P2Rank Service")

P2RANK_PATH = "/app/p2rank/prank"


@app.get("/health")
async def health():
    return {"status": "ok", "p2rank_found": os.path.isfile(P2RANK_PATH)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
