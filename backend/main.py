import hashlib
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from routers import targets, pockets, ligands, predictions, antibody, export, search, stats, properties, reports, report_pdf, similar, safety, assistant, analytics, activity_cliffs, interactions, affinity
from services.database import init_db, close_db

# Simple in-memory response cache for GET endpoints (1 hour TTL)
_response_cache: dict[str, tuple[float, int, dict, bytes]] = {}
CACHE_TTL = 3600  # 1 hour
CACHE_MAX_ENTRIES = 200


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("OpenDDE backend starting...")
    try:
        from migrations.run import apply_pending
        apply_pending()
    except Exception as e:
        print(f"[migrations] startup migration failed: {e}")
    init_db()
    yield
    _response_cache.clear()
    close_db()


app = FastAPI(title="OpenDDE API", lifespan=lifespan)


# Headers that must not be cached — they depend on the request (CORS), on the
# cache layer itself (x-cache), or on the body length (content-length).
_UNCACHEABLE_HEADERS = {
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-expose-headers",
    "access-control-max-age",
    "vary",
    "content-length",
    "x-cache",
}


@app.middleware("http")
async def cache_get_responses(request: Request, call_next):
    """Cache GET /api/v1/ JSON responses for 1 hour.

    CORS headers are NOT cached — they depend on the request Origin and are
    added on the way out by CORSMiddleware (which wraps this middleware).
    """
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
            return Response(
                content=body,
                status_code=status,
                headers={**headers, "x-cache": "HIT"},
                media_type="application/json",
            )
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

        # Strip request-specific headers (CORS, content-length) before caching
        # so they get regenerated correctly on each cache hit.
        cached_headers = {
            k: v for k, v in response.headers.items()
            if k.lower() not in _UNCACHEABLE_HEADERS
        }
        _response_cache[cache_key] = (now, 200, cached_headers, body)
        return Response(
            content=body,
            status_code=200,
            headers={**cached_headers, "x-cache": "MISS"},
            media_type="application/json",
        )

    return response


# CORS must be registered AFTER the cache middleware so it ends up as the
# OUTERMOST wrapper — this way Access-Control-Allow-Origin is added on every
# response (including cache hits), regardless of what the cache stored.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/_cache/clear")
async def clear_cache():
    count = len(_response_cache)
    _response_cache.clear()
    return {"cleared": count}

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
app.include_router(interactions.router, prefix="/api/v1")
app.include_router(affinity.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}
