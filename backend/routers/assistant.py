import json

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import settings

router = APIRouter()

CLAUDE_MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """You are an expert medicinal chemist and drug design advisor embedded in OpenDDE, an open-source drug design workbench. You have access to the current target, pocket predictions, and known ligand data shown in the context.

Your role:
- Interpret pocket druggability scores and what they mean practically
- Explain structure-activity relationships in the known ligand data
- Suggest molecular modifications based on pocket chemistry
- Compare pockets and recommend which to prioritize
- Explain drug design concepts when asked
- Assess target tractability and safety considerations

Be concise, specific, and actionable. Reference the actual data in your context. Use drug design terminology appropriate for a medicinal chemist audience. Format responses with markdown for readability."""


class ChatRequest(BaseModel):
    message: str
    context: dict = {}
    history: list[dict] = []


@router.post("/assistant/chat")
async def chat(request: ChatRequest):
    if not settings.CLAUDE_API_KEY:
        raise HTTPException(status_code=503, detail="Claude API key not configured")

    # Build messages with context
    messages = []

    # Include conversation history
    for msg in request.history[-10:]:  # last 10 messages
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Build the user message with context
    context_str = ""
    if request.context:
        context_str = f"Current page context:\n```json\n{json.dumps(request.context, indent=2, default=str)}\n```\n\n"

    messages.append({
        "role": "user",
        "content": f"{context_str}Question: {request.message}",
    })

    async def stream_response():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 1024,
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                    "stream": True,
                },
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    yield f"data: {json.dumps({'type': 'error', 'error': body.decode()})}\n\n"
                    return
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        yield f"{line}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
