import uvicorn
from fastapi import FastAPI

app = FastAPI(title="ImmuneBuilder Service")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
