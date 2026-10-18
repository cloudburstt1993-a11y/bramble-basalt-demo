/* Bramble & Basalt demo: site search over search-index.json (built with the pages). */
(() => {
  'use strict';
  const { $, esc, track } = window.BB;
  const input = $('#site-q'), out = $('#search-out'), count = $('#search-count');
  if (!input) return;
  let index = [];
  const ORDER = ['Page', 'Product', 'Article', 'FAQ', 'Español'];
  const mark = (s, terms) => terms.reduce((h, t) => h.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark class="rounded bg-sun-200 px-0.5">$1</mark>'), esc(s));
  const run = () => {
    const q = input.value.trim().toLowerCase();
    const u = new URL(location.href);
    q ? u.searchParams.set('q', input.value.trim()) : u.searchParams.delete('q');
    history.replaceState(null, '', u);
    if (q.length < 2) { out.innerHTML = ''; count.textContent = ''; return; }
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = index.map(e => {
      const t = e.t.toLowerCase(), x = (e.x || '').toLowerCase(), d = e.d.toLowerCase();
      let s = 0;
      for (const w of terms) { if (t.includes(w)) s += 5; if (x.includes(w)) s += 2; if (d.includes(w)) s += 1; if (!t.includes(w) && !x.includes(w) && !d.includes(w)) return null; }
      return { e, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s);
    count.textContent = hits.length ? `${hits.length} result${hits.length === 1 ? '' : 's'} for “${input.value.trim()}”` : '';
    if (!hits.length) {
      out.innerHTML = `<div class="py-10 text-center"><p class="title-3">Nothing found for “${esc(input.value.trim())}”.</p><p class="muted mt-2">Try “sprinkler”, “patio”, “gift card” or “hours”, or <a class="link" href="tel:+19705550142">call us</a>.</p></div>`;
      return;
    }
    const groups = ORDER.map(k => [k, hits.filter(h => h.e.k === k)]).filter(([, l]) => l.length);
    out.innerHTML = groups.map(([k, l]) => `<section class="mt-8"><h2 class="title-3">${k === 'Page' ? 'Pages' : k === 'FAQ' ? 'Answers' : k === 'Español' ? 'En español' : k + 's'}</h2><ul class="mt-3 grid gap-3">${l.slice(0, 8).map(({ e }) => `<li><a class="card card-link block p-4" href="${esc(e.u)}"><b class="block">${mark(e.t, terms)}</b><span class="mt-1 block text-sm text-basalt-600">${mark(e.d, terms)}</span></a></li>`).join('')}</ul></section>`).join('');
  };
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 150); });
  $('#search-form').addEventListener('submit', e => { e.preventDefault(); run(); track('search', { search_term: input.value.trim() }); });
  fetch('search-index.json').then(r => r.json()).then(j => {
    index = j;
    const q = new URLSearchParams(location.search).get('q');
    if (q) { input.value = q; run(); track('search', { search_term: q }); }
  }).catch(() => { out.innerHTML = '<p class="muted">Search needs a connection. Try the <a class="link" href="sitemap.html">site map</a>.</p>'; });
  input.focus();
})();
