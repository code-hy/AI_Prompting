"""FastAPI backend for the Prompt Engineering Demo.

Endpoints:
- GET  /api/health
- GET  /api/document          -> bundled ATO RFQ document context
- GET  /api/prompts           -> list of prompts (bundled + GitHub library)
- GET  /api/prompts/{id}      -> full prompt template content
- POST /api/chat              -> SSE streamed LLM response
"""

import json
import logging
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from documents import load_document
from github_service import get_prompts
from llm_service import build_system_prompt, is_mock_mode, stream_chat

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("demochat")

app = FastAPI(title="AI Prompt Engineering Demo", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_DOCUMENT_TEXT = load_document()
_HISTORY_LIMIT = 10


# ---- Request models --------------------------------------------------------

class ChatTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str
    promptTemplateContent: Optional[str] = None  # noqa: F821
    promptTemplateName: Optional[str] = None     # noqa: F821
    documentContext: Optional[str] = None        # noqa: F821
    history: Optional[list[ChatTurn]] = None


# ---- Helpers ---------------------------------------------------------------

def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _build_messages(req: ChatRequest) -> list[dict[str, str]]:
    if req.promptTemplateContent:
        doc = req.documentContext or _DOCUMENT_TEXT
        system_prompt = build_system_prompt(doc, req.promptTemplateContent)
        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    else:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful, professional assistant in a Prompt Engineering Demo. "
                    "When a document context is available, ground your answers in it. "
                    "Do not invent information that is not present."
                ),
            }
        ]

    for turn in (req.history or [])[-_HISTORY_LIMIT:]:
        messages.append({"role": turn.role, "content": turn.content})

    messages.append({"role": "user", "content": req.message})
    return messages


# ---- Routes ----------------------------------------------------------------

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "mock_mode": is_mock_mode()}


@app.get("/api/document")
def document() -> dict:
    return {"reference": "SPC-17765", "text": _DOCUMENT_TEXT}


@app.get("/api/prompts")
async def prompts() -> list[dict]:
    return await get_prompts()


@app.get("/api/prompts/{prompt_id}")
async def prompt_detail(prompt_id: str) -> dict:
    for prompt in await get_prompts():
        if prompt["id"] == prompt_id:
            return prompt
    raise HTTPException(status_code=404, detail="Prompt not found")


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    messages = _build_messages(req)

    def event_stream():
        yield _sse(
            "meta",
            {
                "promptTemplateName": req.promptTemplateName,
                "mock": is_mock_mode(),
                "documentId": "SPC-17765",
            },
        )
        try:
            for piece in stream_chat(messages):
                yield _sse("delta", {"content": piece})
            yield _sse("done", {"finishReason": "stop"})
        except Exception as exc:  # noqa: BLE001
            log.exception("LLM stream failed")
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )