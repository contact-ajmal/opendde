import hashlib
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from routers import targets, pockets, ligands, predictions, antibody, export, search, stats, properties, reports, report_pdf, similar, safety, assistant, analytics, activity_cliffs

# Simple in-memory response cache for GET endpoints (1 hour TTL)
_response_cache: dict[str, tuple[float, int, dict, bytes]] = {}
CACHE_TTL = 3600  # 1 hour
CACHE_MAX_ENTRIES = 200


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("OpenDDE backend starting...")
    yield
    _response_cache.clear()


app = FastAPI(title="OpenDDE API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cache_get_responses(request: Request, call_next):
    """Cache GET /api/v1/ JSON responses for 1 hour."""
    if request.method != "GET" or not request.url.path.startswith("/api/v1/"):
        return await call_next(request)

    # Skip streaming and file endpoints
    if "/structures/" in request.url.path or "/pdf" in request.url.path:
        return await call_next(request)

    cache_key = hashlib.md5(str(request.url).encode()).hexdigest()
    now = time.time()

    # Check cache
    if cache_key in _response_cache:
        ts, status, headers, body = _response_cache[cache_key]
        if now - ts < CACHE_TTL:
            return Response(content=body, status_code=status, headers=headers)
        else:
            del _response_cache[cache_key]

    response = await call_next(request)

    # Only cache successful JSON responses
    if response.status_code == 200 and "application/json" in response.headers.get("content-type", ""):
        body = b""
        async for chunk in response.body_iterator:
            body += chunk if isinstance(chunk, bytes) else chunk.encode()

        # Evict oldest if too many entries
        if len(_response_cache) >= CACHE_MAX_ENTRIES:
            oldest = min(_response_cache, key=lambda k: _response_cache[k][0])
            del _response_cache[oldest]

        # Preserve ALL response headers (including CORS) so cache hits don't
        # strip Access-Control-Allow-Origin and break the browser fetch.
        cached_headers = dict(response.headers)
        cached_headers.pop("content-length", None)  # recomputed by Response
        cached_headers["x-cache"] = "HIT"
        _response_cache[cache_key] = (now, 200, cached_headers, body)
        return Response(content=body, status_code=200, headers={**dict(response.headers), "x-cache": "MISS"})

    return response

app.include_router(targets.router, prefix="/api/v1")
app.include_router(pockets.router, prefix="/api/v1")
app.include_router(ligands.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(antibody.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(report_pdf.router, prefix="/api/v1")
app.include_router(similar.router, prefix="/api/v1")
app.include_router(safety.router, prefix="/api/v1")
app.include_router(assistant.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(activity_cliffs.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}
