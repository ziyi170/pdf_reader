const BASE = process.env.REACT_APP_API_URL || '';

export async function askAI(text, context) {
  const res = await fetch(`${BASE}/api/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });
  return res.json();
}

export async function translateText(text, targetLang = 'zh') {
  const res = await fetch(`${BASE}/api/ai/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_lang: targetLang }),
  });
  return res.json();
}

export async function getNotes() {
  const res = await fetch(`${BASE}/api/notes`);
  return res.json();
}

export async function saveNote(content, sourceText, noteType, page) {
  const res = await fetch(`${BASE}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, source_text: sourceText, note_type: noteType, page }),
  });
  return res.json();
}

export async function deleteNote(id) {
  await fetch(`${BASE}/api/notes/${id}`, { method: 'DELETE' });
}
