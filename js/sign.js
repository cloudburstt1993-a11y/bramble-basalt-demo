/* Bramble & Basalt demo: e-signature pad.
   <div data-sigpad> … <canvas>, <input type="hidden" name="signature">, [data-sig-clear],
   [data-sig-typed] (type-your-name alternative for keyboard and screen-reader users).
   Live builds can send the signed form to Documenso, DocuSign or Dropbox Sign. */
(() => {
  'use strict';
  const { $, $$, toast } = window.BB;

  $$('[data-sigpad]').forEach(pad => {
    const canvas = $('canvas', pad), ctx = canvas.getContext('2d');
    const out = $('input[name="signature"]', pad), typed = $('[data-sig-typed]', pad), err = $('[data-sig-error]', pad);
    let drawing = false, drew = false, last = null;
    const size = () => {
      const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = getComputedStyle(pad).getPropertyValue('--sig-ink').trim();
    };
    size();
    // Re-measure when the pad first becomes visible or the screen rotates, until someone signs.
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (!drew) size(); }).observe(canvas);
    const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', e => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke();
      last = p; drew = true;
    });
    const end = () => { if (!drawing) return; drawing = false; if (drew) { out.value = canvas.toDataURL('image/png'); if (err) err.hidden = true; } };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    $('[data-sig-clear]', pad)?.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); drew = false; out.value = ''; if (typed) typed.value = ''; });
    typed?.addEventListener('input', () => { if (typed.value.trim()) { out.value = 'typed:' + typed.value.trim(); if (err) err.hidden = true; } else if (!drew) out.value = ''; });
    pad.sigOk = () => {
      if (out.value) return true;
      if (err) err.hidden = false;
      toast('Please sign: draw with your finger or mouse, or type your full name.');
      (typed || canvas).focus();
      return false;
    };
  });

  // Block a form from submitting until its signature is in. Capture phase, so this
  // runs before the form's own handlers.
  document.addEventListener('submit', e => {
    const pad = e.target.querySelector('[data-sigpad]');
    if (pad && pad.sigOk && !pad.sigOk()) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  window.BB.sigOk = form => { const pad = form.querySelector('[data-sigpad]'); return !pad || pad.sigOk(); };
})();
