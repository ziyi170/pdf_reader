"""
Unit tests for PDF Reader API.
Run: pytest tests/ -v
"""
import io
import pytest
from fastapi.testclient import TestClient
from main import app
from api.models import clear_notes

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_notes():
    clear_notes()
    yield
    clear_notes()


# ── health ────────────────────────────────────────────────────────────────────

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── notes ─────────────────────────────────────────────────────────────────────

def test_create_note():
    res = client.post("/api/notes", json={
        "content": "This is a test note",
        "source_text": "original text",
        "note_type": "text",
        "page": 1,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["content"] == "This is a test note"
    assert data["note_type"] == "text"
    assert "id" in data


def test_list_notes_empty():
    res = client.get("/api/notes")
    assert res.status_code == 200
    assert res.json() == []


def test_list_notes_after_create():
    client.post("/api/notes", json={"content": "Note A", "note_type": "text", "page": 1})
    client.post("/api/notes", json={"content": "Note B", "note_type": "ai", "page": 2})
    res = client.get("/api/notes")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_delete_note():
    create = client.post("/api/notes", json={"content": "To delete", "note_type": "text", "page": 1})
    note_id = create.json()["id"]
    res = client.delete(f"/api/notes/{note_id}")
    assert res.status_code == 204
    assert client.get("/api/notes").json() == []


def test_delete_nonexistent_note():
    res = client.delete("/api/notes/does-not-exist")
    assert res.status_code == 404


# ── PDF ───────────────────────────────────────────────────────────────────────

def test_upload_non_pdf():
    res = client.post(
        "/api/pdf/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert res.status_code == 400


def test_get_page_without_upload():
    from api.models import _pdf_cache
    _pdf_cache.clear()
    res = client.get("/api/pdf/page/1")
    assert res.status_code == 404


# ── AI (mock — no API key needed) ────────────────────────────────────────────

def test_ask_ai_returns_response():
    res = client.post("/api/ai/ask", json={"text": "What is machine learning?"})
    assert res.status_code == 200
    assert "answer" in res.json()
    assert len(res.json()["answer"]) > 0


def test_translate_returns_response():
    res = client.post("/api/ai/translate", json={"text": "Hello world", "target_lang": "zh"})
    assert res.status_code == 200
    assert "translation" in res.json()
