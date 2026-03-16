import React from 'react';

const C = {
  bg: '#16161a', surface: '#1e1e24', border: '#2a2a35',
  text: '#e8e6e0', muted: '#6b6b80', accent: '#7c6af7',
  green: '#4ade80', amber: '#fbbf24', red: '#f87171',
};
const font = "'Inter', sans-serif";
const mono = "'JetBrains Mono', monospace";

function Tag({ children, color = C.accent }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px',
      background: color + '22', color, border: `1px solid ${color}44`, fontFamily: mono }}>
      {children}
    </span>
  );
}

const typeColor = { text: C.green, ai: C.accent, screenshot: C.amber };

export default function NotesSidebar({ notes, onDelete }) {
  return (
    <div style={{ width: '280px', background: C.surface, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', height: '100%', fontFamily: font }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: C.text }}>Notes</span>
        <Tag color={C.muted}>{notes.length}</Tag>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {notes.length === 0 && (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: '12px', padding: '32px 8px', lineHeight: 1.6 }}>
            Select text or draw a region<br />to save notes here
          </div>
        )}
        {[...notes].reverse().map(note => (
          <div key={note.id} style={{ background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Tag color={typeColor[note.note_type] || C.muted}>{note.note_type}</Tag>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: C.muted, fontFamily: mono }}>p.{note.page}</span>
                <button onClick={() => onDelete(note.id)} style={{
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.red,
                  borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer', fontFamily: font }}>✕</button>
              </div>
            </div>
            {note.note_type === 'screenshot' ? (
              <img src={note.content} alt="screenshot" style={{ width: '100%', borderRadius: '4px', display: 'block' }} />
            ) : (
              <div style={{ fontSize: '12px', color: C.text, lineHeight: '1.6', userSelect: 'text' }}>
                {note.content}
              </div>
            )}
            {note.source_text && note.note_type !== 'screenshot' && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: C.muted,
                borderTop: `1px solid ${C.border}`, paddingTop: '6px', fontStyle: 'italic' }}>
                "{note.source_text.slice(0, 60)}{note.source_text.length > 60 ? '…' : ''}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
