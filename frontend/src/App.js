import React, { useState, useEffect, useRef, useCallback } from 'react';
import PDFPage from './components/PDFPage';
import NotesSidebar from './components/NotesSidebar';
import SelectionToolbar from './components/SelectionToolbar';
import ResultPanel from './components/ResultPanel';
import { askAI, translateText, getNotes, saveNote, deleteNote } from './api';

/* ── load pdf.js from CDN once ─────────────────────────────────────────────── */
function usePdfJs() {
  const [ready, setReady] = useState(!!window.pdfjsLib);
  useEffect(() => {
    if (window.pdfjsLib) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setReady(true);
    };
    document.head.appendChild(s);
  }, []);
  return ready;
}

/* ── palette / constants ───────────────────────────────────────────────────── */
const C = {
  bg: '#16161a', surface: '#1e1e24', border: '#2a2a35',
  text: '#e8e6e0', muted: '#6b6b80', accent: '#7c6af7', amber: '#fbbf24',
};
const font = "'Inter', sans-serif";
const mono = "'JetBrains Mono', monospace";

function Btn({ children, onClick, disabled, active, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: `1px solid ${active ? C.accent : C.border}`,
      borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '12px', fontWeight: '500', fontFamily: font,
      padding: '5px 12px', opacity: disabled ? 0.45 : 1,
      background: active ? C.accent + '22' : C.surface,
      color: active ? C.accent : C.text, transition: 'all 0.15s', ...style,
    }}>{children}</button>
  );
}

/* ── upload drop zone ──────────────────────────────────────────────────────── */
function UploadZone({ onFile }) {
  const inputRef = useRef();
  const [drag, setDrag]   = useState(false);

  const handle = f => { if (f?.type === 'application/pdf') onFile(f); else alert('Please upload a PDF'); };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        style={{ border: `2px dashed ${drag ? C.accent : C.border}`, borderRadius: '16px',
          padding: '64px 96px', cursor: 'pointer', textAlign: 'center',
          background: drag ? C.accent + '11' : 'transparent', transition: 'all 0.2s' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <div style={{ fontSize: '15px', fontWeight: '500', color: C.text, marginBottom: '8px' }}>Drop a PDF here</div>
        <div style={{ fontSize: '13px', color: C.muted }}>or click to browse</div>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

/* ── root ──────────────────────────────────────────────────────────────────── */
export default function App() {
  const pdfReady  = usePdfJs();
  const [pdfDoc, setPdfDoc]     = useState(null);
  const [filename, setFilename] = useState('');
  const [pageNum, setPageNum]   = useState(1);
  const [pageObj, setPageObj]   = useState(null);
  const [mode, setMode]         = useState('select');   // 'select' | 'region'
  const [notes, setNotes]       = useState([]);
  const [toolbar, setToolbar]   = useState(null);       // {x,y,text}
  const [result, setResult]     = useState(null);
  const [loadingAI, setLoading] = useState(false);

  /* load notes on mount */
  useEffect(() => { getNotes().then(setNotes).catch(() => {}); }, []);

  /* load page object whenever doc or page number changes */
  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(pageNum).then(setPageObj).catch(console.error);
  }, [pdfDoc, pageNum]);

  /* open a PDF file with pdf.js */
  const openFile = useCallback(async (file) => {
    if (!pdfReady) return;
    const buf = await file.arrayBuffer();
    const doc = await window.pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(doc);
    setFilename(file.name);
    setPageNum(1);
  }, [pdfReady]);

  /* text selection → show toolbar */
  useEffect(() => {
    const handler = (e) => {
      if (mode !== 'select') return;
      const sel = window.getSelection()?.toString().trim();
      if (sel && sel.length > 1) {
        setToolbar({ x: e.clientX, y: e.clientY, text: sel });
      } else {
        setToolbar(null);
      }
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [mode]);

  /* AI ask */
  const handleAsk = async () => {
    if (!toolbar) return;
    const text = toolbar.text;
    setToolbar(null);
    setLoading(true);
    try {
      const { answer } = await askAI(text);
      setResult({ type: 'ai', text: answer, source: text });
    } finally { setLoading(false); }
  };

  /* translate */
  const handleTranslate = async () => {
    if (!toolbar) return;
    const text = toolbar.text;
    setToolbar(null);
    setLoading(true);
    try {
      const { translation } = await translateText(text);
      setResult({ type: 'translate', text: translation, source: text });
    } finally { setLoading(false); }
  };

  /* save text note */
  const handleSaveText = async (content, sourceText, type = 'text') => {
    const note = await saveNote(content, sourceText, type, pageNum);
    setNotes(n => [...n, note]);
  };

  /* save screenshot note from region selection */
  const handleRegion = async (dataUrl) => {
    const note = await saveNote(dataUrl, null, 'screenshot', pageNum);
    setNotes(n => [...n, note]);
    setMode('select');
  };

  /* delete note */
  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes(n => n.filter(x => x.id !== id));
  };

  const changePage = (n) => {
    if (!pdfDoc) return;
    if (n >= 1 && n <= pdfDoc.numPages) setPageNum(n);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: font, color: C.text }}>

      {/* ── header ── */}
      <header style={{ height: '48px', background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>PDF Reader</span>

        {pdfDoc && <>
          <span style={{ fontSize: '12px', color: C.muted, fontFamily: mono, marginLeft: '4px' }}>{filename}</span>
          <span style={{ fontSize: '11px', color: C.muted, fontFamily: mono, background: C.border + '88',
            padding: '2px 8px', borderRadius: '20px' }}>{pdfDoc.numPages} pages</span>

          {/* mode toggle */}
          <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
            <Btn active={mode === 'select'} onClick={() => setMode('select')}>✍ Select text</Btn>
            <Btn active={mode === 'region'} onClick={() => setMode('region')}>⬚ Region</Btn>
          </div>

          {/* page nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {loadingAI && <span style={{ fontSize: '12px', color: C.accent, fontFamily: mono }}>AI…</span>}
            <Btn onClick={() => changePage(pageNum - 1)} disabled={pageNum <= 1}>←</Btn>
            <span style={{ fontSize: '12px', color: C.muted, fontFamily: mono }}>{pageNum} / {pdfDoc.numPages}</span>
            <Btn onClick={() => changePage(pageNum + 1)} disabled={pageNum >= pdfDoc.numPages}>→</Btn>
            <Btn onClick={() => { setPdfDoc(null); setPageObj(null); setFilename(''); }} style={{ marginLeft: '8px' }}>Change PDF</Btn>
          </div>
        </>}

        {mode === 'region' && (
          <div style={{ marginLeft: pdfDoc ? '0' : 'auto', fontSize: '12px', color: C.amber,
            background: C.amber + '15', border: `1px solid ${C.amber}33`,
            borderRadius: '6px', padding: '3px 10px' }}>
            Draw a rectangle to capture a screenshot
          </div>
        )}
      </header>

      {/* ── body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* viewer */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex',
          flexDirection: 'column', alignItems: 'center', padding: '32px 24px', background: C.bg }}>
          {!pdfDoc
            ? <UploadZone onFile={openFile} />
            : pageObj
              ? <PDFPage page={pageObj} scale={1.5} mode={mode} onRegion={handleRegion} />
              : <div style={{ color: C.muted, fontSize: '13px', marginTop: '80px' }}>Loading page…</div>
          }
        </div>

        {/* notes */}
        <NotesSidebar notes={notes} onDelete={handleDelete} />
      </div>

      {/* floating text toolbar */}
      <SelectionToolbar
        pos={toolbar}
        onAsk={handleAsk}
        onTranslate={handleTranslate}
        onSave={() => { handleSaveText(toolbar.text, null, 'text'); setToolbar(null); }}
        onClose={() => setToolbar(null)}
      />

      {/* AI / translate result */}
      <ResultPanel
        result={result}
        onSaveSelection={(sel, type) => handleSaveText(sel, result?.source, type)}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
