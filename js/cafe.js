/* Bramble & Basalt demo: café menu filters + order-ahead for pickup.
   Live builds hand the order to Square, Toast or Clover online ordering. */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, toast, track, stripeDemo, HOURS, h12, denverNow, sendLead, sendFailed } = window.BB;
  const menu = $('#menu');
  if (!menu) return;

  /* ---- dietary filters (all selected must match) ---- */
  const pills = $$('[data-diet-filter]');
  const applyDiet = () => {
    const want = pills.filter(p => p.getAttribute('aria-pressed') === 'true').map(p => p.dataset.dietFilter);
    let shown = 0;
    $$('[data-item]', menu).forEach(li => { const tags = li.dataset.diet.split(' '); const hit = want.every(w => tags.includes(w)); li.hidden = !hit; if (hit) shown++; });
    $$('[data-menu-section]', menu).forEach(s => { s.hidden = !$$('[data-item]', s).some(li => !li.hidden); });
    $('#menu-count').textContent = want.length ? `${shown} item${shown === 1 ? '' : 's'} match` : '';
  };
  pills.forEach(p => p.addEventListener('click', () => { p.setAttribute('aria-pressed', String(p.getAttribute('aria-pressed') !== 'true')); applyDiet(); }));

  /* ---- order ahead ---- */
  const order = new Map();
  const listEl = $('#order-list'), totalEl = $('#order-total'), countEl = $('#order-count'), form = $('#order-form');
  const paint = () => {
    const rows = [...order.values()];
    countEl.textContent = rows.reduce((n, r) => n + r.qty, 0);
    listEl.innerHTML = rows.length ? rows.map(r => `
      <li class="flex items-center justify-between gap-3 py-2">
        <span class="min-w-0"><span class="font-semibold">${esc(r.name)}</span><span class="block text-sm text-basalt-600 tabular">${money(r.price)} each</span></span>
        <span class="stepper shrink-0" role="group" aria-label="Quantity of ${esc(r.name)}"><button type="button" aria-label="One fewer" data-o="${esc(r.name)}" data-d="-1">${icon('minus', 'icon-sm')}</button><span class="w-7 text-center font-semibold tabular">${r.qty}</span><button type="button" aria-label="One more" data-o="${esc(r.name)}" data-d="1">${icon('plus', 'icon-sm')}</button></span>
      </li>`).join('') : '<li class="py-3 text-sm text-basalt-600">Nothing yet. Tap “Add” on anything above.</li>';
    totalEl.textContent = money(rows.reduce((s, r) => s + r.price * r.qty, 0));
    $('#order-submit').setAttribute('aria-disabled', String(!rows.length));
  };
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-order-add]');
    if (!b) return;
    const li = b.closest('[data-item]'), name = li.dataset.name, price = +li.dataset.price;
    const r = order.get(name) || { name, price, qty: 0 };
    r.qty++; order.set(name, r); paint();
    toast(`${icon('check', 'icon-sm')} ${esc(name)} added`, { href: '#order', label: 'View order' });
    track('add_to_cart', { item_name: name, value: price, currency: 'USD', item_category: 'cafe' });
  });
  listEl.addEventListener('click', e => {
    const b = e.target.closest('[data-o]');
    if (!b) return;
    const r = order.get(b.dataset.o); r.qty += +b.dataset.d;
    if (r.qty < 1) order.delete(r.name);
    paint();
  });

  // Pickup times in 15-minute steps, Mountain time, inside café hours.
  const sel = $('#order-time');
  (() => {
    const { day, mins } = denverNow();
    const out = [];
    for (let k = 0; k < 7 && out.length < 1; k++) {
      const d = (day + k) % 7, h = HOURS.cafe[d];
      if (!h) continue;
      let start = h[0] * 60 + 15;
      if (k === 0) start = Math.max(start, Math.ceil((mins + 20) / 15) * 15);
      const label = k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];
      for (let m = start; m <= h[1] * 60 - 15; m += 15) out.push(`${label} ${h12(Math.floor(m / 60)).replace(' ', ':' + String(m % 60).padStart(2, '0') + ' ')}`);
    }
    sel.innerHTML = out.map((t, i) => `<option${i === 0 ? ' selected' : ''}>${t}${i === 0 ? ' (soonest)' : ''}</option>`).join('');
  })();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const rows = [...order.values()];
    if (!rows.length) { toast('Add something from the menu first.'); return; }
    const d = new FormData(form), total = rows.reduce((s, r) => s + r.price * r.qty, 0);
    if (d.get('pay') === 'now') {
      const paid = await stripeDemo({ title: 'Potting Shed Café pickup', lines: rows.map(r => ({ label: `${r.name} × ${r.qty}`, amount: r.price * r.qty })), total });
      if (!paid) return;
    }
    const num = Math.floor(100 + Math.random() * 899);
    if (!(await sendLead('cafe-order', { order: '#' + num, items: rows.map(r => `${r.qty} × ${r.name}`).join('; '), total: money(total), pickup: String(d.get('time')), name: String(d.get('name')), phone: String(d.get('phone')), paid_online: d.get('pay') === 'now' ? 'yes' : 'no' }))) { sendFailed(); return; }
    track('purchase', { transaction_id: 'CAFE-' + num, value: total, currency: 'USD', item_category: 'cafe' });
    form.hidden = true;
    const done = $('#order-done');
    done.hidden = false;
    done.innerHTML = `
      <span class="grid size-12 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check')}</span>
      <p class="title-3 mt-3" tabindex="-1" id="order-done-h">Order #${num} is in!</p>
      <p class="muted mt-2">Ready <b>${esc(String(d.get('time')).replace(' (soonest)', ''))}</b> at the café pickup shelf, under ${esc(String(d.get('name')).trim())}. ${d.get('pay') === 'now' ? 'Paid online.' : 'Pay when you pick up.'}</p>
      <p class="help mt-3">We’ll text ${esc(d.get('phone'))} when it’s ready. Demo: no order was sent.</p>`;
    $('#order-done-h').focus();
    order.clear(); paint();
  });
  paint();
})();
