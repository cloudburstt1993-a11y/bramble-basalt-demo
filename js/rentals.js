/* Bramble & Basalt demo: equipment rentals with date-range pricing, availability
   and a refundable deposit. */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, track, stripeDemo, ics, fmtDate } = window.BB;
  const form = $('#rent-form');
  if (!form) return;
  const ITEMS = {
    aerator: { name: 'Core aerator', day: 85, week: 240, deposit: 150 },
    tiller: { name: 'Rear-tine tiller', day: 65, week: 190, deposit: 100 },
    sodcutter: { name: 'Sod cutter', day: 95, week: 280, deposit: 150 },
    auger: { name: 'One-person post-hole auger', day: 55, week: 160, deposit: 75 },
    trailer: { name: '5×8 utility trailer', day: 45, week: 130, deposit: 100 },
  };
  const DELIVERY = 60;
  const iso = d => d.toISOString().slice(0, 10);
  const start = $('#rent-start'), end = $('#rent-end');
  const t0 = new Date(); t0.setDate(t0.getDate() + 1);
  start.min = iso(t0); end.min = iso(t0);
  const max = new Date(); max.setDate(max.getDate() + 90); start.max = end.max = iso(max);
  start.value = iso(t0);
  const t1 = new Date(t0); t1.setDate(t1.getDate() + 1); end.value = iso(t1);

  const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const local = v => new Date(v + 'T12:00');
  const calc = () => {
    const d = new FormData(form), it = ITEMS[d.get('item')];
    if (!it || !start.value || !end.value) return null;
    const a = local(start.value), b = local(end.value);
    const days = Math.max(1, Math.round((b - a) / 864e5));
    const weeks = Math.floor(days / 7), rem = days % 7;
    const rent = weeks * it.week + Math.min(rem * it.day, it.week);
    const booked = [];
    for (let i = 0; i < days; i++) { const x = new Date(a); x.setDate(x.getDate() + i); if (hash(d.get('item') + iso(x)) % 9 === 0) booked.push(x); }
    const del = d.get('delivery') === 'yes' ? DELIVERY : 0;
    return { it, days, rent, del, deposit: it.deposit, booked, a, b, total: rent + del + it.deposit };
  };
  const paint = () => {
    if (end.value && start.value && end.value <= start.value) { const x = local(start.value); x.setDate(x.getDate() + 1); end.value = iso(x); }
    const c = calc(), out = $('#rent-sum'), btn = $('#rent-submit');
    if (!c) { out.innerHTML = '<p class="muted">Pick equipment and dates.</p>'; return; }
    const ok = !c.booked.length;
    btn.disabled = !ok;
    out.innerHTML = `
      <p class="flex items-center gap-2 text-sm font-semibold ${ok ? 'text-juniper-800' : 'text-danger-700'}">${icon(ok ? 'check' : 'info', 'icon-sm')} ${ok ? `Available ${fmtDate(c.a, { month: 'short', day: 'numeric' })} – ${fmtDate(c.b, { month: 'short', day: 'numeric' })}` : `Already rented on ${c.booked.map(x => fmtDate(x, { month: 'short', day: 'numeric' })).join(', ')}. Try other dates.`}</p>
      <dl class="mt-3 grid gap-1.5 text-sm">
        <div class="flex justify-between"><dt>${esc(c.it.name)} · ${c.days} day${c.days > 1 ? 's' : ''}</dt><dd class="tabular">${money(c.rent)}</dd></div>
        ${c.del ? `<div class="flex justify-between"><dt>Delivery &amp; pickup</dt><dd class="tabular">${money(c.del)}</dd></div>` : ''}
        <div class="flex justify-between"><dt>Refundable deposit</dt><dd class="tabular">${money(c.deposit)}</dd></div>
        <div class="mt-1 flex justify-between border-t border-sand-200 pt-2 text-base font-semibold"><dt>Due today</dt><dd class="tabular">${money(c.total)}</dd></div>
      </dl>
      <p class="help mt-2">You never pay more than the weekly rate for any 7 days. Deposit refunded when it's back clean.</p>`;
  };
  form.addEventListener('change', paint);
  form.addEventListener('input', paint);
  paint();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const c = calc();
    if (!c || c.booked.length) return;
    const lines = [{ label: `${c.it.name}, ${c.days} day${c.days > 1 ? 's' : ''}`, amount: c.rent }];
    if (c.del) lines.push({ label: 'Delivery & pickup', amount: c.del });
    lines.push({ label: 'Refundable deposit', amount: c.deposit });
    const paid = await stripeDemo({ title: 'Equipment rental', lines, total: c.total });
    if (!paid) return;
    track('purchase', { value: c.total, currency: 'USD', item_category: 'rental', item_name: c.it.name });
    const pickup = new Date(c.a); pickup.setHours(8, 0, 0, 0);
    const done = $('#rent-done');
    form.hidden = true; done.hidden = false;
    done.innerHTML = `<span class="grid size-12 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check')}</span>
      <p class="title-3 mt-3" tabindex="-1" id="rent-done-h">Reserved: ${esc(c.it.name)}</p>
      <p class="muted mt-2">${c.del ? 'We’ll deliver' : 'Pick up at the materials yard'} from 8 am on ${fmtDate(c.a)}. Return by 5 pm on ${fmtDate(c.b)}. We’ll text a reminder the day before.</p>
      <button type="button" class="btn btn-light btn-sm mt-4" id="rent-ics">${icon('calendar', 'icon-sm')} Add to calendar</button>`;
    $('#rent-ics').addEventListener('click', () => ics({ title: `${c.del ? 'Delivery:' : 'Pick up'} ${c.it.name} · Bramble & Basalt`, start: pickup, minutes: 30, location: '860 Mesa Yard Ln, Fruita, CO 81521', details: 'Bring a photo ID. Demo booking.' }));
    $('#rent-done-h').focus();
  });
})();
