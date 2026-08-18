"""Loads the bundled ATO RFQ document that acts as the demo Document Context."""

from pathlib import Path

_DOCUMENT_PATH = Path(__file__).parent / "documents" / "ato_rfq_req260818.md"


def load_document() -> str:
    return _DOCUMENT_PATH.read_text(encoding="utf-8").strip()