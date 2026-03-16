"""
REST API routes:

PDF:
  POST   /api/pdf/upload          Upload PDF, returns page count
  GET    /api/pdf/page/{n}        Render page n as PNG (base64)

AI:
  POST   /api/ai/ask              Ask AI about selected text
  POST   /api/ai/translate        Translate selected text

Notes:
  GET    /api/notes               List all notes
  POST   /api/notes               Save a note
  DELETE /api/notes/{id}          Delete a note
"""
import os
import io
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File
from api.models import (
    NoteCreate, Note, AskRequest, TranslateRequest,
    get_notes, add_note, delete_note, _pdf_cache,
)

router = APIRouter()

# ── PDF ───────────────────────────────────────────────────────────────────────

@router.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")
    data = await file.read()
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=data, filetype="pdf")
        page_count = doc.page_count
        doc.close()
    except Exception as e:
        raise HTTPException(400, f"Could not parse PDF: {e}")
    _pdf_cache["current"] = data
    return {"filename": file.filename, "page_count": page_count}


@router.get("/pdf/page/{page_num}")
async def get_page(page_num: int, scale: float = 1.5):
    if "current" not in _pdf_cache:
        raise HTTPException(404, "No PDF uploaded")
    try:
        import fitz
        doc = fitz.open(stream=_pdf_cache["current"], filetype="pdf")
        if page_num < 1 or page_num > doc.page_count:
            raise HTTPException(400, f"Page {page_num} out of range (1–{doc.page_count})")
        page = doc[page_num - 1]
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        png_bytes = pix.tobytes("png")
        doc.close()
        b64 = base64.b64encode(png_bytes).decode()
        return {
            "page": page_num,
            "image": f"data:image/png;base64,{b64}",
            "width": pix.width,
            "height": pix.height,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── AI ────────────────────────────────────────────────────────────────────────

def _call_openai(system: str, user: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "[Mock] OpenAI API key not set. Set OPENAI_API_KEY in .env to enable AI features."
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"[AI Error] {str(e)}"


@router.post("/ai/ask")
async def ask_ai(body: AskRequest):
    system = (
        "You are a helpful reading assistant. "
        "Explain concepts clearly and concisely. "
        "If context from the document is provided, use it."
    )
    user = f'Selected text: """{body.text}"""'
    if body.context:
        user += f'\n\nSurrounding context: """{body.context}"""'
    user += "\n\nPlease explain this clearly."
    answer = _call_openai(system, user)
    return {"answer": answer}


@router.post("/ai/translate")
async def translate(body: TranslateRequest):
    lang_name = "Chinese" if body.target_lang == "zh" else "English"
    system = f"You are a professional translator. Translate the given text to {lang_name}. Output only the translation, nothing else."
    answer = _call_openai(system, body.text)
    return {"translation": answer}


# ── Notes ─────────────────────────────────────────────────────────────────────

@router.get("/notes", response_model=list[Note])
async def list_notes():
    return get_notes()


@router.post("/notes", response_model=Note, status_code=201)
async def create_note(body: NoteCreate):
    return add_note(body.content, body.source_text, body.note_type, body.page)


@router.delete("/notes/{note_id}", status_code=204)
async def remove_note(note_id: str):
    if not delete_note(note_id):
        raise HTTPException(404, "Note not found")
