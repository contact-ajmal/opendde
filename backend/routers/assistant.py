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


class PocketSummaryRequest(BaseModel):
    uniprot_id: str
    target_name: str = ""
    pockets: list[dict] = []
    ligand_count: int = 0
    regenerate: bool = False


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


POCKET_SUMMARY_PROMPT = """You are an expert medicinal chemist. Given pocket predictions for a drug target, write a concise 2-3 sentence expert analysis. State which pocket is most promising and why, note any interesting features (e.g., large surface area, high druggability), and give a brief druggability assessment. Be specific — reference pocket numbers and scores. Do not use markdown formatting."""


@router.post("/assistant/pocket-summary")
async def pocket_summary(request: PocketSummaryRequest):
    from services.database import get_cached_ai_summary, cache_ai_summary

    if not settings.CLAUDE_API_KEY:
        raise HTTPException(status_code=503, detail="Claude API key not configured")

    # Check cache first (unless regenerating)
    if not request.regenerate:
        cached = get_cached_ai_summary(request.uniprot_id, "pocket_analysis")
        if cached:
            return {"summary": cached, "cached": True}

    # Build pocket data string
    pocket_lines = []
    for p in sorted(request.pockets, key=lambda x: x.get("rank", 0)):
        pocket_lines.append(
            f"Pocket #{p.get('rank')}: score={p.get('score', 0):.1f}, "
            f"druggability={p.get('druggability', 0) * 100:.0f}%, "
            f"residues={p.get('residue_count', 0)}"
        )
    pocket_data = "\n".join(pocket_lines) if pocket_lines else "No pockets detected."

    user_msg = (
        f"Target: {request.target_name} ({request.uniprot_id})\n"
        f"Pocket predictions:\n{pocket_data}\n"
        f"Known ligand count: {request.ligand_count}\n\n"
        f"Write your 2-3 sentence analysis."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 300,
                    "system": POCKET_SUMMARY_PROMPT,
                    "messages": [{"role": "user", "content": user_msg}],
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Claude API request failed")

            data = resp.json()
            text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
            summary = " ".join(text_blocks).strip()

            if not summary:
                raise HTTPException(status_code=502, detail="Empty response from Claude API")

            # Cache the result
            cache_ai_summary(request.uniprot_id, summary, "pocket_analysis")

            return {"summary": summary, "cached": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate summary: {str(e)}")
