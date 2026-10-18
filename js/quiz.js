/* Bramble & Basalt demo: plant finder quiz. Four questions, then the best matches
   from the catalog with add-to-cart. */
(() => {
  'use strict';
  const { $, $$, esc, icon, track, paintWish } = window.BB;
  const root = $('#quiz');
  if (!root) return;
  const Q = [
    { k: 'sun', q: 'How much sun does the spot get?', a: [['full', 'Full sun, 6+ hours', 'sun'], ['part', 'Part sun, 3–6 hours', 'tree']] },
    { k: 'water', q: 'How much do you want to water once it’s settled?', a: [[0, 'Almost never', 'sun'], [1, 'Once a week in summer', 'droplet']] },
    { k: 'size', q: 'How big can it get?', a: [['s', 'Small: pots and edges', 'sprout'], ['m', 'Medium: 1–3 feet', 'leaf'], ['l', 'Large: a statement shrub', 'tree']] },
    { k: 'goal', q: 'What matters most?', a: [['color', 'Flowers and color', 'sparkles'], ['pollinators', 'Bees and hummingbirds', 'heart'], ['structure', 'Year-round shape', 'grid'], ['containers', 'Looks great in a pot', 'store']] },
  ];
  const ans = {};
  let i = 0;
  const step = () => {
    const q = Q[i];
    root.innerHTML = `
      <p class="text-sm font-semibold text-basalt-600" aria-live="polite">Question ${i + 1} of ${Q.length}</p>
      <div class="progress mt-2" aria-hidden="true"><span style="width:${(i / Q.length) * 100}%"></span></div>
      <h2 class="title-2 mt-6" tabindex="-1" id="quiz-q">${q.q}</h2>
      <div class="mt-6 grid gap-3 sm:grid-cols-2">${q.a.map(([v, t, ic]) => `<button type="button" class="quiz-option" data-v="${v}"><span class="grid size-10 shrink-0 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon(ic)}</span>${t}</button>`).join('')}</div>
      ${i ? '<button type="button" class="link mt-6" data-back>← Back</button>' : ''}`;
    if (i) $('#quiz-q').focus();
  };
  const results = () => {
    const plants = window.BB_CATALOG.filter(p => p.traits);
    const scored = plants.map(p => {
      const t = p.traits;
      let s = 0; const why = [];
      if (t.sun.includes(ans.sun)) { s += 3; why.push(ans.sun === 'full' ? 'Loves full sun' : 'Handles part shade'); }
      if (t.water <= +ans.water) { s += 2; why.push(t.water === 0 ? 'Very low water' : 'Low water'); }
      if (t.size === ans.size) { s += 2; why.push({ s: 'Stays small', m: 'Medium size', l: 'Big presence' }[t.size]); }
      if (t.goals.includes(ans.goal)) { s += 3; why.push({ color: 'Bright color', pollinators: 'Pollinator magnet', structure: 'Year-round structure', containers: 'Great in pots' }[ans.goal]); }
      if (t.goals.includes('native')) why.push('Colorado native');
      return { p, s, why };
    }).sort((a, b) => b.s - a.s).slice(0, 3);
    root.innerHTML = `
      <p class="eyebrow">Your matches</p>
      <h2 class="title-2 mt-2" tabindex="-1" id="quiz-q">Three plants that will thrive for you</h2>
      <div class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">${scored.map(({ p, why }, n) => `<div><div class="mb-2 flex flex-wrap gap-1">${why.slice(0, 3).map(w => `<span class="chip chip-juniper">${esc(w)}</span>`).join('')}</div>${window.bbCard(p, n)}</div>`).join('')}</div>
      <div class="mt-8 flex flex-wrap gap-3"><a class="btn btn-primary" href="book.html?service=design">Have a designer plan it</a><button type="button" class="btn btn-light" data-restart>Start over</button></div>`;
    $('#quiz-q').focus();
    paintWish();
    track('quiz_complete', { sun: ans.sun, goal: ans.goal });
  };
  root.addEventListener('click', e => {
    const o = e.target.closest('[data-v]');
    if (o) { ans[Q[i].k] = o.dataset.v; i++; i < Q.length ? step() : results(); return; }
    if (e.target.closest('[data-back]')) { i--; step(); }
    if (e.target.closest('[data-restart]')) { i = 0; step(); }
  });
  step();
})();
