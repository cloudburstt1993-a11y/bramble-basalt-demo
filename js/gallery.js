/* Bramble & Basalt demo: project gallery lightbox (native <dialog>, keyboard friendly). */
(() => {
  'use strict';
  const { $, $$, track, openDialog } = window.BB;
  const dlg = $('#lightbox');
  if (!dlg) return;
  const img = $('#lb-img'), title = $('#lb-title'), meta = $('#lb-meta'), count = $('#lb-count');
  let items = [], i = 0;

  const show = n => {
    i = (n + items.length) % items.length;
    const b = items[i];
    img.src = b.dataset.src; img.alt = b.dataset.alt || b.dataset.title;
    title.textContent = b.dataset.title;
    meta.textContent = b.dataset.meta;
    count.textContent = `${i + 1} of ${items.length}`;
    const st = $('#lb-story');
    if (st) { st.hidden = !b.dataset.story; if (b.dataset.story) st.href = b.dataset.story; }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lightbox]');
    if (!b) return;
    items = $$('[data-lightbox]').filter(x => !x.closest('[hidden]'));
    show(items.indexOf(b));
    openDialog(dlg, b);
    track('view_project', { project: b.dataset.title });
  });
  $('#lb-prev').addEventListener('click', () => show(i - 1));
  $('#lb-next').addEventListener('click', () => show(i + 1));
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
  });
  // Swipe on phones.
  let x0 = null;
  img.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
})();
