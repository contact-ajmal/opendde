from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import targets, pockets, ligands, predictions, antibody


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("OpenDDE backend starting...")
    yield


app = FastAPI(title="OpenDDE API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(targets.router, prefix="/api/v1")
app.include_router(pockets.router, prefix="/api/v1")
app.include_router(ligands.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(antibody.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}
