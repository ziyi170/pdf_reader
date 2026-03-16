"""
In-memory storage + Pydantic models.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    content: str
    source_text: str | None = None
    note_type: str = "text"   # "text" | "ai" | "screenshot"
    page: int = 1

class Note(BaseModel):
    id: str
    content: str
    source_text: str | None
    note_type: str
    page: int
    created_at: str

class AskRequest(BaseModel):
    text: str
    context: str | None = None

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "zh"   # "zh" | "en"

# ── In-memory store ───────────────────────────────────────────────────────────

_notes: list[dict] = []
_pdf_cache: dict[str, bytes] = {}   # filename -> raw bytes


def get_notes() -> list[Note]:
    return [Note(**n) for n in _notes]


def add_note(content: str, source_text: str | None, note_type: str, page: int) -> Note:
    note = Note(
        id=str(uuid.uuid4()),
        content=content,
        source_text=source_text,
        note_type=note_type,
        page=page,
        created_at=datetime.utcnow().isoformat(),
    )
    _notes.append(note.model_dump())
    return note


def delete_note(note_id: str) -> bool:
    before = len(_notes)
    _notes[:] = [n for n in _notes if n["id"] != note_id]
    return len(_notes) < before


def clear_notes():
    _notes.clear()
