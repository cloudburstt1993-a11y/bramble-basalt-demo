/* Bramble & Basalt demo: online estimate approval. Options update the total, the
   client signs, then pays the deposit (Stripe in live builds, a stand-in here). */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, track, stripeDemo, fmtDate } = window.BB;
  const form = $('#est-approve');
  if (!form) return;
  const DEPOSIT = 0.3;
  const issued = new Date(); issued.setDate(issued.getDate() - 4);
  const valid = new Date(issued); valid.setDate(valid.getDate() + 30);
  $('#q-issued').textContent = fmtDate(issued, { month: 'long', day: 'numeric', year: 'numeric' });
  $('#q-valid').textContent = fmtDate(valid, { month: 'long', day: 'numeric', year: 'numeric' });

  const base = $$('[data-line]').reduce((s, el) => s + +el.dataset.line, 0);
  const totals = () => {
    const opts = $$('input[name="option"]:checked', form);
    const extra = opts.reduce((s, o) => s + +o.dataset.price, 0);
    const total = base + extra;
    return { total, deposit: Math.round(total * DEPOSIT * 100) / 100, opts };
  };
  const paint = () => {
    const t = totals();
    $('#q-total').textContent = money(t.total);
    $('#q-deposit').textContent = money(t.deposit);
    $('#q-pay').textContent = `Approve & pay ${money(t.deposit)} deposit`;
    $('#q-opts').innerHTML = t.opts.map(o => `<li class="flex justify-between gap-4 py-2"><span>${esc(o.dataset.label)}</span><span class="tabular">${money(+o.dataset.price)}</span></li>`).join('');
  };
  form.addEventListener('change', paint);
  paint();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!window.BB.sigOk(form)) return;
    const d = new FormData(form), t = totals();
    const paid = await stripeDemo({
      title: 'Deposit for estimate Q-2026-0142',
      lines: [{ label: 'Project total', amount: t.total }, { label: '30% deposit due today', amount: t.deposit }],
      total: t.deposit,
      note: 'The balance is invoiced at the final walkthrough.',
    });
    if (!paid) return;
    track('estimate_approved', { value: t.total, currency: 'USD', deposit: t.deposit });
    const start = new Date(); start.setDate(start.getDate() + 21);
    form.hidden = true;
    const done = $('#est-done');
    done.hidden = false;
    done.innerHTML = `
      <span class="grid size-14 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check', 'icon-lg')}</span>
      <h2 class="title-2 mt-4" tabindex="-1" id="est-done-h">Approved. Thank you, ${esc(String(d.get('signer')).trim().split(/\s+/)[0])}!</h2>
      <p class="lead mt-3">Your ${money(t.deposit)} deposit is in and your build is penciled in for the week of <b>${fmtDate(start, { month: 'long', day: 'numeric' })}</b>. Maya will call within one business day to confirm.</p>
      <p class="muted mt-2">Signed ${fmtDate(new Date(), { month: 'long', day: 'numeric', year: 'numeric' })} by ${esc(d.get('signer'))}. A signed copy and Stripe receipt were emailed. Demo: nothing was charged or signed.</p>
      <div class="mt-6 flex flex-wrap gap-3 no-print"><button type="button" class="btn btn-primary" data-print>${icon('download', 'icon-sm')} Save a signed copy (PDF)</button><a class="btn btn-light" href="portal.html">Go to your client portal</a></div>`;
    $('#est-done-h').focus();
  });

  $('#q-changes-send')?.addEventListener('click', () => {
    if (!$('#q-change').value.trim()) { $('#q-change').focus(); return; }
    $('#q-changes-form').hidden = true;
    $('#q-changes-ok').hidden = false;
    track('estimate_change_request');
  });
})();
