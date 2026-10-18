/* Bramble & Basalt demo: contact page tools: topic prefill, invoice payment, order tracking. */
(() => {
  'use strict';
  const { $, esc, money, icon, track, stripeDemo, payLink, sendLead, toast } = window.BB;

  const topic = new URLSearchParams(location.search).get('topic');
  const sel = $('#ct-topic');
  if (topic && sel && [...sel.options].some(o => o.value === topic)) sel.value = topic;

  const pay = $('#pay-form');
  pay?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(pay), inv = String(d.get('invoice')).trim().toUpperCase(), amt = Math.round(+d.get('amount') * 100) / 100;
    if (payLink('invoice')) { sendLead('invoice-payment', { invoice: inv, amount: money(amt), email: String(d.get('email')) }); track('begin_checkout', { value: amt, currency: 'USD', item_category: 'invoice' }); toast(`Enter <b>${money(amt)}</b> and invoice <b>${esc(inv)}</b> on the Stripe page.`, { ms: 6000 }); setTimeout(() => { location.href = payLink('invoice'); }, 1200); return; }
    const paid = await stripeDemo({ title: `Invoice ${inv}`, lines: [{ label: `Invoice ${inv}`, amount: amt }], total: amt });
    if (!paid) return;
    track('purchase', { transaction_id: inv, value: amt, currency: 'USD', item_category: 'invoice' });
    pay.hidden = true;
    const out = $('#pay-done');
    out.hidden = false;
    out.innerHTML = `<p class="flex items-center gap-2 font-semibold text-juniper-800" tabindex="-1" id="pay-ok">${icon('check')} ${money(amt)} paid on ${esc(inv)}. Thank you!</p><p class="help mt-1">Stripe emailed a receipt to ${esc(d.get('email'))}. Demo: nothing was charged.</p>`;
    $('#pay-ok').focus();
  });

  const tf = $('#track-form');
  tf?.addEventListener('submit', e => {
    e.preventDefault();
    const num = String(new FormData(tf).get('order')).trim().toUpperCase();
    const steps = [['Order received', true], ['Being picked & potted', true], ['Ready for pickup', false], ['Picked up', false]];
    $('#track-out').innerHTML = `
      <p class="font-semibold">Order ${esc(num)} <span class="sample-tag">Sample status</span></p>
      <ol class="mt-3 grid gap-3">${steps.map(([s, done], i) => `<li class="flex items-center gap-3"><span class="grid size-8 place-items-center rounded-full ${done ? 'bg-juniper-700 text-white' : i === 2 ? 'border-2 border-juniper-700 text-juniper-800' : 'border-2 border-sand-300 text-basalt-600'}">${done ? icon('check', 'icon-sm') : i + 1}</span><span class="${done ? 'font-semibold' : ''}">${s}${i === 2 ? ' · usually within 2 hours' : ''}</span></li>`).join('')}</ol>
      <p class="help mt-3">Live sites read this from the store's order system and text updates automatically.</p>`;
    track('order_status_check');
  });
})();
