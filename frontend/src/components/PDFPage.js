import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function PDFPage({ page, scale = 1.5, mode, onRegion }) {
  const canvasRef  = useRef();
  const textRef    = useRef();
  const overlayRef = useRef();
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!page || !window.pdfjsLib) return;

    const viewport = page.getViewport({ scale });
    const canvas   = canvasRef.current;
    const ctx      = canvas.getContext('2d');
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    setDims({ width: viewport.width, height: viewport.height });

    let cancelled = false;
    const renderTask = page.render({ canvasContext: ctx, viewport });

    renderTask.promise.then(async () => {
      if (cancelled) return;
      const textContent = await page.getTextContent();
      if (cancelled) return;

      const textDiv = textRef.current;
      if (!textDiv) return;
      textDiv.innerHTML = '';

      textContent.items.forEach(item => {
        if (!item.str || !item.str.trim()) return;

        const [a, b, c, d, e, f] = window.pdfjsLib.Util.transform(
          viewport.transform,
          item.transform
        );

        const fontHeight = Math.sqrt(a * a + b * b);
        const textWidth  = item.width * scale;
        const angle = Math.atan2(b, a);
        const x = e;
        const y = f - fontHeight;

        const charCount = item.str.length;
        const naturalWidth = fontHeight * charCount * 0.55;
        const scaleX = charCount > 0 && naturalWidth > 0
          ? textWidth / naturalWidth
          : 1;

        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.cssText = [
          'position:absolute',
          `left:${x}px`,
          `top:${y}px`,
          `font-size:${fontHeight}px`,
          'line-height:1',
          'white-space:pre',
          'cursor:text',
          'color:transparent',
          'transform-origin:0% 0%',
          `transform:scaleX(${scaleX})${angle !== 0 ? ` rotate(${-angle}rad)` : ''}`,
        ].join(';');
        textDiv.appendChild(span);
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      try { renderTask.cancel(); } catch {}
    };
  }, [page, scale]);

  const drag = useRef({ active: false, x0: 0, y0: 0 });

  const getXY = useCallback((e) => {
    const oc   = overlayRef.current;
    const rect = oc.getBoundingClientRect();
    const scaleX = oc.width  / rect.width;
    const scaleY = oc.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }, []);

  const onMouseDown = useCallback((e) => {
    if (mode !== 'region') return;
    e.preventDefault();
    const { x, y } = getXY(e);
    drag.current = { active: true, x0: x, y0: y };
  }, [mode, getXY]);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    const { x, y } = getXY(e);
    const oc  = overlayRef.current;
    const ctx = oc.getContext('2d');
    ctx.clearRect(0, 0, oc.width, oc.height);
    ctx.strokeStyle = '#7c6af7';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle   = 'rgba(124,106,247,0.08)';
    const { x0, y0 } = drag.current;
    ctx.strokeRect(x0, y0, x - x0, y - y0);
    ctx.fillRect(x0, y0, x - x0, y - y0);
  }, [getXY]);

  const onMouseUp = useCallback((e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const { x, y } = getXY(e);
    const { x0, y0 } = drag.current;

    const oc = overlayRef.current;
    oc.getContext('2d').clearRect(0, 0, oc.width, oc.height);

    const rw = Math.abs(x - x0), rh = Math.abs(y - y0);
    if (rw < 8 || rh < 8) return;

    const sx = Math.min(x0, x), sy = Math.min(y0, y);
    const tmp = document.createElement('canvas');
    tmp.width  = rw;
    tmp.height = rh;
    tmp.getContext('2d').drawImage(canvasRef.current, sx, sy, rw, rh, 0, 0, rw, rh);
    onRegion && onRegion(tmp.toDataURL('image/png'));
  }, [getXY, onRegion]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }} />

      <div
        ref={textRef}
        className="textLayer"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: dims.width  + 'px',
          height: dims.height + 'px',
          overflow: 'hidden',
          pointerEvents: mode === 'region' ? 'none' : 'auto',
          userSelect:    mode === 'region' ? 'none' : 'text',
        }}
      />

      <canvas
        ref={overlayRef}
        width={dims.width}
        height={dims.height}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: dims.width  + 'px',
          height: dims.height + 'px',
          cursor: mode === 'region' ? 'crosshair' : 'default',
          pointerEvents: mode === 'region' ? 'auto' : 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />
    </div>
  );
}
