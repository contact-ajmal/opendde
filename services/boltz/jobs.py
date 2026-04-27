import json
import uuid
import time
from typing import Optional
from redis import asyncio as aioredis

REDIS_URL = "redis://redis:6379"
JOB_PREFIX = "boltz:job:"
QUEUE_KEY = "boltz:queue"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

_redis = None

async def get_redis():
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis

async def create_job(payload: dict) -> str:
    job_id = str(uuid.uuid4())
    record = {
        "id": job_id,
        "status": "queued",
        "created_at": time.time(),
        "started_at": None,
        "completed_at": None,
        "payload": payload,
        "result": None,
        "error": None,
        "progress": 0,
    }
    r = await get_redis()
    await r.setex(JOB_PREFIX + job_id, JOB_TTL_SECONDS, json.dumps(record))
    await r.rpush(QUEUE_KEY, job_id)
    return job_id

async def get_job(job_id: str) -> Optional[dict]:
    r = await get_redis()
    raw = await r.get(JOB_PREFIX + job_id)
    return json.loads(raw) if raw else None

async def update_job(job_id: str, **fields):
    r = await get_redis()
    raw = await r.get(JOB_PREFIX + job_id)
    if not raw:
        return
    record = json.loads(raw)
    record.update(fields)
    await r.setex(JOB_PREFIX + job_id, JOB_TTL_SECONDS, json.dumps(record))

async def pop_next_job() -> Optional[str]:
    r = await get_redis()
    job_id = await r.lpop(QUEUE_KEY)
    return job_id
