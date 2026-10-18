/* Bramble & Basalt demo: catering order builder priced by headcount. */
(() => {
  'use strict';
  const { $, $$, esc, money, track, stripeDemo } = window.BB;
  const form = $('#cater-form');
  if (!form) return;
  const order = () => {
    const d = new FormData(form);
    const n = Math.max(10, Math.min(200, Math.round(+d.get('guests') || 10)));
    const pkg = $(`input[name="package"]:checked`, form);
    const lines = [{ label: `${pkg.dataset.label} × ${n} guests`, amount: n * +pkg.dataset.pp }];
    $$('input[name="addon"]:checked', form).forEach(a => lines.push({ label: a.dataset.label + (a.dataset.pp ? ` × ${n}` : ''), amount: a.dataset.pp ? n * +a.dataset.pp : +a.dataset.flat }));
    const total = lines.reduce((s, l) => s + l.amount, 0);
    return { n, lines, total, deposit: Math.round(total * 0.25 * 100) / 100 };
  };
  const paint = () => {
    const o = order();
    $('#cater-lines').innerHTML = o.lines.map(l => `<li class="flex justify-between gap-4 py-1.5"><span>${esc(l.label)}</span><span class="tabular">${money(l.amount)}</span></li>`).join('');
    $('#cater-total').textContent = money(o.total);
    $('#cater-pp').textContent = `${money(o.total / o.n)} per guest`;
    $('#cater-deposit').textContent = `Pay 25% deposit (${money(o.deposit)})`;
  };
  form.addEventListener('input', paint);
  form.addEventListener('change', paint);
  paint();
  $('#cater-deposit').addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const o = order();
    const paid = await stripeDemo({ title: 'Catering deposit', lines: [...o.lines, { label: '25% deposit due today', amount: o.deposit }], total: o.deposit, note: 'Balance due on delivery.' });
    if (!paid) return;
    track('purchase', { value: o.deposit, currency: 'USD', item_category: 'catering' });
    form.requestSubmit();
  });
})();
