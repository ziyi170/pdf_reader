import React from 'react';

const C = { surface: '#1e1e24', border: '#2a2a35', accent: '#7c6af7', text: '#e8e6e0', muted: '#6b6b80' };
const font = "'Inter', sans-serif";

function Btn({ children, onClick, variant = 'default' }) {
  const base = { border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', fontFamily: font, padding: '5px 11px' };
  const v = {
    primary: { background: C.accent, color: '#fff' },
    default: { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
  };
  return <button style={{ ...base, ...v[variant] }} onClick={onClick}>{children}</button>;
}

export default function SelectionToolbar({ pos, onAsk, onTranslate, onSave, onClose }) {
  if (!pos) return null;
  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y - 48, zIndex: 1000,
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px',
      padding: '6px 8px', display: 'flex', gap: '6px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      transform: 'translateX(-50%)',
    }}>
      <Btn variant="primary" onClick={onAsk}>Ask AI</Btn>
      <Btn onClick={onTranslate}>Translate</Btn>
      <Btn onClick={onSave}>Save</Btn>
      <Btn variant="ghost" onClick={onClose}>✕</Btn>
    </div>
  );
}
