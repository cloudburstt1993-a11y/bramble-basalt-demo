/* Bramble & Basalt demo: instant estimate, financing calculator, multi-step quote form. */
(() => {
  'use strict';
  const { $, $$, esc, money, track } = window.BB;
  const round100 = v => Math.round(v / 100) * 100;
  const whole = v => money(v).replace('.00', '');

  /* ------------------------------------------------------- estimator -- */
  const est = $('#est-form');
  let lastEstimate = null;
  if (est) {
    // $/sq ft by finish level: Essential, Signature, Showpiece (demo numbers).
    const RATES = {
      patio: { label: 'New patio', r: [16, 22, 32] },
      xeriscape: { label: 'Xeriscape conversion', r: [5, 7.5, 11] },
      sod: { label: 'New sod lawn', r: [2.2, 2.8, 3.6] },
      irrigation: { label: 'Irrigation system', r: [1.4, 1.9, 2.6] },
      makeover: { label: 'Full yard makeover', r: [12, 17, 25] },
    };
    const ADDONS = { lighting: ['Landscape lighting', () => 1800], firepit: ['Gas fire pit', () => 2400], drip: ['Drip irrigation', () => 950], edging: ['Steel edging', () => 650], removal: ['Old lawn removal', a => a * 0.9], boulders: ['Boulders & accents', () => 700] };
    const range = $('#est-area'), num = $('#est-area-n');
    range.addEventListener('input', () => { num.value = range.value; calc(); });
    num.addEventListener('input', () => { const v = Math.max(100, Math.min(5000, +num.value || 0)); range.value = v; calc(); });
    est.addEventListener('change', calc);

    function calc() {
      const d = new FormData(est);
      const type = d.get('type'), tier = +d.get('tier'), area = Math.max(100, Math.min(5000, +num.value || 100));
      const base = area * RATES[type].r[tier];
      const lines = [[`${RATES[type].label}, ${area.toLocaleString()} sq ft`, base]];
      d.getAll('addon').forEach(a => lines.push([ADDONS[a][0], ADDONS[a][1](area)]));
      const sub = Math.max(1500, lines.reduce((s, l) => s + l[1], 0));
      const lo = round100(sub * 0.92), hi = round100(sub * 1.12);
      lastEstimate = { lo, hi, mid: round100((lo + hi) / 2), type: RATES[type].label, area, lines };
      $('#est-range').textContent = `${whole(lo)} – ${whole(hi)}`;
      $('#est-break').innerHTML = lines.map(([k, v]) => `<li class="flex justify-between gap-4 py-1.5"><span>${esc(k)}</span><span class="tabular">≈ ${whole(round100(v))}</span></li>`).join('');
      $('#est-monthly').textContent = whole(payment(lastEstimate.mid, 60, 9.99));
    }
    calc();
    let tracked = false;
    est.addEventListener('change', () => { if (!tracked) { track('estimate_calculated', { project: lastEstimate.type, value: lastEstimate.mid }); tracked = true; } });

    $('#est-use')?.addEventListener('click', () => {
      const f = $('#quote-form');
      const note = $('#q-notes');
      note.value = `Online estimate: ${lastEstimate.type}, about ${lastEstimate.area.toLocaleString()} sq ft, ${whole(lastEstimate.lo)}–${whole(lastEstimate.hi)}.\n` + note.value;
      $('#quote').scrollIntoView({ behavior: 'smooth' });
      $('input,select,textarea', f).focus({ preventScroll: true });
    });
    $('#fin-use')?.addEventListener('click', () => { $('#fin-amount').value = lastEstimate.mid; fin(); });
  }

  /* ------------------------------------------------------- financing -- */
  function payment(p, n, apr) { const r = apr / 1200; return r ? p * r / (1 - Math.pow(1 + r, -n)) : p / n; }
  const finForm = $('#fin-form');
  function fin() {
    if (!finForm) return;
    const p = Math.max(0, +$('#fin-amount').value || 0), n = +$('#fin-term').value, apr = Math.max(0, +$('#fin-apr').value || 0);
    const m = payment(p, n, apr);
    $('#fin-out').textContent = money(m);
    $('#fin-detail').textContent = `${n} payments · ${money(m * n - p)} total interest at ${apr}% APR`;
  }
  if (finForm) { finForm.addEventListener('input', fin); finForm.addEventListener('submit', e => e.preventDefault()); fin(); }

  /* ------------------------------------------- multi-step quote form -- */
  const form = $('#quote-form');
  if (form) {
    const steps = $$('[data-step]', form);
    const bar = $('#q-progress'), label = $('#q-step-label');
    let i = 0;
    const show = (n, focus = true) => {
      i = n;
      steps.forEach((s, k) => { s.hidden = k !== n; });
      bar.style.width = `${((n + 1) / steps.length) * 100}%`;
      label.textContent = `Step ${n + 1} of ${steps.length}: ${steps[n].dataset.title}`;
      if (focus) $('h3', steps[n])?.focus();
    };
    form.addEventListener('click', e => {
      if (e.target.closest('[data-next]')) {
        const fields = $$('input,select,textarea', steps[i]);
        for (const f of fields) if (!f.checkValidity()) { f.reportValidity(); return; }
        show(i + 1); track('quote_step', { step: i + 1 });
      }
      if (e.target.closest('[data-back]')) show(i - 1);
    });
    show(0, false);
    document.addEventListener('click', e => { if (e.target.closest('[data-form-reset]')) { show(0, false); $('#q-thumbs').innerHTML = ''; $('#q-photo-count').textContent = ''; } });

    const photos = $('#q-photos'), thumbs = $('#q-thumbs');
    photos.addEventListener('change', () => {
      thumbs.innerHTML = '';
      [...photos.files].slice(0, 6).forEach(f => {
        if (!f.type.startsWith('image/')) return;
        const li = document.createElement('li');
        li.className = 'frame aspect-square';
        const img = document.createElement('img');
        img.alt = f.name; img.src = URL.createObjectURL(f);
        li.append(img); thumbs.append(li);
      });
      $('#q-photo-count').textContent = photos.files.length ? `${photos.files.length} photo${photos.files.length === 1 ? '' : 's'} attached` : '';
    });
  }
})();
