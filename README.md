# PDF Reader — AI-Powered Document Assistant

An AI-assisted PDF reading tool. Upload any PDF, select text, and instantly ask AI questions, translate passages, or save highlights to your notes.

## Features

- **PDF rendering** — Upload and read any PDF page by page
- **Text selection → Ask AI** — Select any text, ask AI to explain it
- **Text selection → Translate** — Instant Chinese/English translation
- **Save to notes** — Save selected text or AI answers to a persistent sidebar
- **Result panel** — Select parts of AI answers and save them too

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + PyMuPDF |
| AI | OpenAI GPT-4o-mini |
| Frontend | React 18 |
| Containerisation | Docker + docker-compose |
| Tests | pytest |

## Project Structure

```
pdf-reader/
├── backend/
│   ├── main.py
│   ├── api/
│   │   ├── routes.py       # PDF, AI, notes endpoints
│   │   └── models.py       # Pydantic schemas + storage
│   ├── tests/
│   │   └── test_api.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js          # Full UI
│   │   ├── api.js          # API client
│   │   └── index.js
│   └── package.json
└── docker-compose.yml
```

## Quick Start

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
echo "OPENAI_API_KEY=sk-your-key" > .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm start
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pdf/upload` | Upload PDF |
| GET | `/api/pdf/page/{n}` | Render page n as image |
| POST | `/api/ai/ask` | Ask AI about selected text |
| POST | `/api/ai/translate` | Translate selected text |
| GET | `/api/notes` | List saved notes |
| POST | `/api/notes` | Save a note |
| DELETE | `/api/notes/{id}` | Delete a note |

## Running Tests

```bash
cd backend && pytest tests/ -v
```

## Note

AI features require a valid `OPENAI_API_KEY`. Without one, the app still works — AI endpoints return a mock response so you can test the full flow.
