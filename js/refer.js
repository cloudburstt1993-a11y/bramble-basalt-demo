/* Bramble & Basalt demo: referral program. Makes a personal share link with a code;
   a visitor arriving with ?ref= sees the offer (handled in main.js). */
(() => {
  'use strict';
  const { $, esc, icon, track, store } = window.BB;
  const form = $('#refer-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const first = String(d.get('name')).trim().split(/\s+/)[0] || 'friend';
    const code = (first.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 8) || 'FRIEND') + '50';
    const link = new URL('index.html', location.href);
    link.searchParams.set('ref', code);
    link.searchParams.set('utm_source', 'referral');
    link.searchParams.set('utm_medium', 'friend');
    store.set('bb-my-ref', code);
    form.hidden = true;
    const ok = $('#refer-ok');
    ok.hidden = false;
    ok.innerHTML = `
      <p class="title-3" tabindex="-1" id="refer-h">Your code is <span class="coupon-code">${esc(code)}</span></p>
      <p class="muted mt-2">Share this link. When a friend books their first project, they get $50 off and we send you a $50 gift card.</p>
      <div class="mt-4 flex flex-col gap-2 sm:flex-row"><input class="input" readonly value="${esc(link.href)}" aria-label="Your referral link"><button type="button" class="btn btn-primary shrink-0" data-copy="${esc(link.href)}">${icon('link', 'icon-sm')} Copy link</button></div>
      <div class="mt-3 flex flex-wrap gap-2">
        <a class="btn btn-light btn-sm" href="sms:?&body=${encodeURIComponent(`Bramble & Basalt did our yard. Use my link for $50 off: ${link.href}`)}">${icon('message', 'icon-sm')} Text it</a>
        <a class="btn btn-light btn-sm" href="mailto:?subject=${encodeURIComponent('$50 off your yard project')}&body=${encodeURIComponent(`Use my link for $50 off at Bramble & Basalt: ${link.href}`)}">${icon('mail', 'icon-sm')} Email it</a>
      </div>`;
    $('#refer-h').focus();
    track('referral_created', { lead_source: window.BB.src });
    window.BB.sendLead('referral-signup', { name: String(d.get('name')), email: String(d.get('email')), code });
  });
})();
