import React, { useState } from 'react';

const C = { surface: '#1e1e24', border: '#2a2a35', accent: '#7c6af7',
  text: '#e8e6e0', muted: '#6b6b80', amber: '#fbbf24', red: '#f87171' };
const font = "'Inter', sans-serif";
const mono = "'JetBrains Mono', monospace";

function Tag({ children, color }) {
  return <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px',
    background: color + '22', color, border: `1px solid ${color}44`, fontFamily: mono }}>{children}</span>;
}

export default function ResultPanel({ result, onSaveSelection, onClose }) {
  const [sel, setSel] = useState('');
  if (!result) return null;

  return (
    <div style={{
      position: 'fixed', right: 296, bottom: 24, width: '360px', maxHeight: '420px',
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
      display: 'flex', flexDirection: 'column', zIndex: 900,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontFamily: font,
    }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tag color={result.type === 'ai' ? C.accent : C.amber}>
          {result.type === 'ai' ? 'AI Answer' : 'Translation'}
        </Tag>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {sel && (
            <button onClick={() => { onSaveSelection(sel, result.type); setSel(''); }}
              style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: '6px',
                fontSize: '11px', padding: '4px 10px', cursor: 'pointer', fontFamily: font }}>
              Save selected
            </button>
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      </div>
      <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1,
        fontSize: '13px', lineHeight: '1.7', color: C.text, userSelect: 'text', whiteSpace: 'pre-wrap' }}
        onMouseUp={() => { const s = window.getSelection()?.toString().trim(); if (s) setSel(s); }}>
        {result.text}
      </div>
      {result.source && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${C.border}`,
          fontSize: '11px', color: C.muted, fontFamily: mono }}>
          "{result.source.slice(0, 80)}{result.source.length > 80 ? '…' : ''}"
        </div>
      )}
    </div>
  );
}
