# AI Prompt Engineering Demo — Chat Application

[![CI](https://github.com/code-hy/AI_Prompting/actions/workflows/ci.yml/badge.svg)](https://github.com/code-hy/AI_Prompting/actions/workflows/ci.yml)

A functional demo (chat.z.ai-style UI) that combines a **GitHub-hosted Prompt
Library** with a pre-loaded **ATO RFQ document (REQ-260818)**. The user selects a
prompt template; the LLM executes it against the document using a
**meta-prompt** that validates template requirements against the context and
refuses to hallucinate missing information.

## Architecture

```
client/   Next.js 14 + Tailwind CSS + Zustand (split-pane chat UI, SSE streaming)
server/   Python FastAPI backend
          ├── main.py            /api/prompts, /api/prompts/{id}, /api/document, /api/chat (SSE)
          ├── github_service.py  fetches code-hy/prompt_library prompts (cached)
          ├── llm_service.py     DeepSeek (OpenAI-compatible) + mock fallback
          ├── documents/         REQ-260818 ATO RFQ (Document Context)
          └── prompts/           bundled demo-scenario templates
```

- **Frontend** proxies `/api/*` to the backend via `next.config.mjs` rewrites
  (target `http://localhost:8001` by default, override with `BACKEND_URL`).
- **LLM**: DeepSeek `deepseek-chat` via the OpenAI SDK. Without a key the
  backend runs a clearly-labelled **mock mode** so the demo works offline.
  Backend dependencies are managed with **uv** (`server/pyproject.toml` + `uv.lock`).

## Ports used by this demo

The default dev ports were moved to avoid clashing with other services running
on this machine (port 3000 serves an existing Open WebUI; port 8000 serves an
existing FastAPI app).

| Service | URL                                   |
| ------- | ------------------------------------- |
| Frontend | http://localhost:3001                 |
| Backend  | http://localhost:8001                 |
| API docs | http://localhost:8001/docs            |

## Run it

### 1. Backend (port 8001)

Requires [uv](https://docs.astral.sh/uv/) (uv 0.12+).

```powershell
cd server
uv sync                        # creates .venv + installs deps from pyproject.toml (uv.lock)
Copy-Item .env.example .env    # then add DEEPSEEK_API_KEY
uv run uvicorn main:app --port 8001
```

Setting `DEEPSEEK_API_KEY` in `server\.env` enables real model calls
(mock mode is used when it is empty). `DEEPSEEK_BASE_URL` /
`DEEPSEEK_MODEL` are also configurable. `uv run` loads `server\.env` automatically
(it is also read by the app via `python-dotenv`), and it is git-ignored.

### 2. Frontend (port 3001)

```powershell
cd client
npm install
npm run dev
# optional: $env:BACKEND_URL = "http://localhost:8001" if you changed the backend port
```

Open http://localhost:3001.

## Demo script (3 scenarios)

1. **Compliance & Evaluation Extractor** — click "Run". LLM parses the RFQ's
   *Assessment of Quotes* section into a structured list
   (Goods/Services · Delivery/Management · Financials).
2. **Bidder Readiness Checklist** — click "Run". LLM synthesises mandatory
   forms, security requirements and the 3:00 pm ACT **7 Aug 2026** deadline
   into a Markdown checklist.
3. **Executive Summary Drafter** — click "Run". The template requires the
   company's capability statement, which is absent from the document; the
   LLM **asks for it instead of hallucinating**.

The **Prompt Library** sidebar also lists the live prompts from
`github.com/code-hy/prompt_library` (`command.prompt.md` files, front-matter
parsed for title/description; body passed to the LLM).

## Key design points

- **Meta-prompt (§4.3)**: document context + selected template are injected
  into a system prompt with explicit execution rules (execute the template; if
  information is missing, report it — never fabricate).
- **Streaming**: `/api/chat` returns Server-Sent Events
  (`meta` → `delta`… → `done` / `error`); the client renders deltas live.
- **Front-matter parsing**: GitHub and bundled prompts both use YAML front
  matter (`name`/`description`) for the UI list; only the body reaches the LLM.
- **Document precedence**: the ATO RFQ is passed as the system-message
  Document Context; a client-supplied `documentContext` overrides it.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests:

- **Backend** — installs [uv](https://docs.astral.sh/uv/), runs `uv sync --frozen`
  against `server/pyproject.toml` + `server/uv.lock`, then a smoke check that
  imports the FastAPI app and verifies the meta-prompt builder.
- **Client** — `npm ci` and `next build` (which also runs the TypeScript and
  lint checks).

The DeepSeek API key is **never** required in CI — the backend test suite and
smoke checks run in mock mode.