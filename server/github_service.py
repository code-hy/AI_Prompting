"""Prompt library: bundled demo scenarios + live GitHub prompt library.

The GitHub library (code-hy/prompt_library) stores Claude-style
`command.prompt.md` files with YAML front-matter under `.github/prompts/<category>/`.

We list it via the one-shot recursive trees API and read each file's raw text,
so a full refresh costs one GitHub API request (raw fetches are unlimited).
"""

import os
import time
import re
from pathlib import Path
from typing import Any, Optional

import httpx
import yaml

REPO = "code-hy/prompt_library"
BRANCH = "main"
PROMPTS_DIR = ".github/prompts"
GITHUB_API = os.getenv("GITHUB_BASE_URL", "https://api.github.com")
GITHUB_RAW = os.getenv("GITHUB_RAW_BASE_URL", "https://raw.githubusercontent.com")

# ---- Front-matter parsing -------------------------------------------------

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Split YAML front-matter from the markdown body.

    Returns (meta, body). If there is no front-matter, returns ({}, text).
    """
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return {}, text.strip()
    try:
        meta = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        meta = {}
    return meta, match.group(2).strip()


def _humanize(slug: str) -> str:
    return re.sub(r"[-_]+", " ", slug).strip().title()


# ---- Bundled demo scenarios -----------------------------------------------

_BUNDLED_DIR = Path(__file__).parent / "prompts"


def load_bundled_prompts() -> list[dict[str, Any]]:
    prompts: list[dict[str, Any]] = []
    if not _BUNDLED_DIR.exists():
        return prompts
    for file in sorted(_BUNDLED_DIR.glob("*.md")):
        meta, body = parse_frontmatter(file.read_text(encoding="utf-8"))
        prompts.append(
            {
                "id": file.stem,
                "name": meta.get("name") or _humanize(file.stem),
                "description": meta.get("description", ""),
                "content": body,
                "source": "bundled",
                "category": "Runnable Demo",
                "content_url": None,
            }
        )
    return prompts


# ---- GitHub library (cached) ----------------------------------------------

_cache: dict[str, Any] = {"data": None, "ts": 0.0}
_CACHE_TTL = 300.0  # seconds


async def _fetch_json(url: str) -> Optional[Any]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers={"Accept": "application/vnd.github+json"})
        resp.raise_for_status()
        return resp.json()


async def _load_github_prompts() -> list[dict[str, Any]]:
    tree_url = f"{GITHUB_API}/repos/{REPO}/git/trees/{BRANCH}?recursive=1"
    tree = await _fetch_json(tree_url)
    paths = [
        item["path"]
        for item in tree.get("tree", [])
        if item.get("type") == "blob" and item["path"].startswith(f"{PROMPTS_DIR}/")
    ]

    prompts: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=15) as client:
        for path in sorted(paths):
            segments = path.split("/")
            if len(segments) < 4:  # .github/prompts/<category>/<file>.md
                continue
            category = segments[2]
            raw_url = f"{GITHUB_RAW}/{REPO}/{BRANCH}/{path}"
            resp = await client.get(raw_url)
            if resp.status_code != 200:
                continue
            meta, body = parse_frontmatter(resp.text)
            if not body:
                continue
            name = (
                meta.get("name")
                or meta.get("description")
                or _humanize(category)
            )
            prompts.append(
                {
                    "id": category,
                    "name": name,
                    "description": meta.get("description", ""),
                    "content": body,
                    "source": "github",
                    "category": "GitHub Library",
                    "content_url": raw_url,
                }
            )
    return prompts


async def get_prompts(force: bool = False) -> list[dict[str, Any]]:
    """Bundled + GitHub prompts. GitHub failure degrades to bundled-only."""
    bundled = load_bundled_prompts()
    if force or time.time() - _cache["ts"] > _CACHE_TTL or _cache["data"] is None:
        try:
            github_prompts = await _load_github_prompts()
            if github_prompts:
                _cache["data"] = github_prompts
                _cache["ts"] = time.time()
        except Exception:
            # Keep whatever we had last; the demo scenarios still work.
            _cache["data"] = _cache["data"] or []
    return bundled + _cache["data"]