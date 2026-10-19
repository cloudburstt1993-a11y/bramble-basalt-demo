/* Bramble & Basalt demo: site-wide behavior. Vanilla JS, loaded with defer.
   Page scripts (shop.js, book.js, …) load after this file and use window.BB. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = v => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="${ROOT}assets/icons.svg#${id}"/></svg>`;
  const ROOT = document.documentElement.dataset.root || '';

  // Storage that never throws: private windows and blocked storage fall back to memory.
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* memory only */ } },
  };

  /* ---------------------------------------------------- live services -- */
  // Fill these in to switch each integration on. Anything left empty stays in
  // demo mode, so the site always works. Only public IDs and links go here:
  // never a Stripe secret key.
  const CONFIG = {
    ga4: 'G-9CMP8DK83V',  // loaded in <head> on every page
    formspree: 'mkjoevop', // https://formspree.io/f/<id>, in the demo Formspree login
    // cal.com/demo-bcw: booking type slugs keyed by the service radios on book.html
    cal: { user: 'demo-bcw', events: { estimate: 'estimate', design: 'design', blowout: 'blowout', lawn: 'lawn', shop: 'shop' } },
    // Stripe Payment Links in the "Bramble & Basalt demo" sandbox (test mode, no
    // real charges), keyed by what they sell. Each redirects to
    // thank-you.html?form=paid&item=<key>.
    stripe: Object.fromEntries(Object.entries({
      'product-blue-grama-0': '14A7sNedzeyR1DV5I3co000',
      'product-blue-grama-1': '5kQ6oJedz9exgyPb2nco001',
      'product-hens-chicks-0': 'eVq4gBc5rbmFeqHb2nco002',
      'product-apache-plume-0': '9B6aEZedzcqJ0zR9Yjco003',
      'product-penstemon-0': '5kQ28tfhD8at0zRgmHco004',
      'product-lavender-0': '4gM9AVedzfCV3M32vRco005',
      'product-potting-mix-0': '00w14p5H3gGZfuLb2nco006',
      'product-cedar-mulch-0': '7sY4gBfhD8at6Yfeezco007',
      'product-basalt-planter-0': 'aFa14p3yV2Q9dmDeezco008',
      'product-basalt-planter-1': 'cNiaEZb1n4Yhbev7Qbco009',
      'product-basalt-planter-2': '6oUcN7d9vgGZ82j7Qbco00a',
      'product-terracotta-bowl-0': '9B69AV3yVgGZ3M38Ufco00b',
      'product-hori-hori-0': '4gMaEZ2uRduN82j0nJco00c',
      'product-gloves-0': 'bJe00lc5r76pgyPfiDco00d',
      'product-gloves-1': 'dRm9AV5H39ex1DVc6rco00e',
      'product-gloves-2': '4gM00l2uR4YhfuL2vRco00f',
      'product-watering-can-0': '4gM28tb1n0I14Q72vRco00g',
      'product-wildflower-seed-0': 'dRm6oJ4CZcqJ82jeezco00h',
      'product-house-coffee-0': '28E4gB7PbaiBfuL8Ufco00i',
      'product-house-coffee-1': '8x23cx3yVaiB96n3zVco00j',
      'product-trucker-cap-0': '14A5kF8Tf2Q9gyPeezco00k',
      'plan-tidy-monthly': '4gM7sN2uR76p82j2vRco00l',
      'plan-full-care-monthly': '9B6eVf9Xj3Ud3M3davco00m',
      'plan-estate-monthly': 'aFadRb1qNfCV6Yfb2nco00n',
      'plan-tidy-season': '7sYcN70mJ4Yh1DV4DZco00o',
      'plan-full-care-season': 'fZu8wR6L7aiBaargmHco00p',
      'plan-estate-season': 'bJe5kF8TfduN96n5I3co00q',
      'event-bulbs': '14AaEZc5rfCV2HZ0nJco00r',
      'event-sprouts': 'dRmaEZd9v9exeqH9Yjco00s',
      'event-wreath': '5kQ14p8Tf9ex96n1rNco00t',
      'event-pruning': 'dRmdRb2uReyR2HZ4DZco00u',
      'event-seeds': '00w4gB5H32Q90zRfiDco00v',
      'giftcard-25': '5kQ6oJc5rcqJ82jb2nco00w',
      'giftcard-50': '3cIaEZc5r0I1gyP7Qbco00x',
      'giftcard-100': '5kQ7sN4CZ4Yh0zR9Yjco00y',
      'giftcard-150': 'cNi5kFd9v4Yh82jeezco00z',
      'giftcard-custom': '14AaEZb1ncqJ0zReezco00A',
      'invoice': '7sYcN77PbgGZdmDgmHco00B',
    }).map(([k, id]) => [k, `https://buy.stripe.com/test_${id}`]).concat([
      ['donation', 'https://donate.stripe.com/test_8x26oJ8TfduNbev5I3co00C'],
    ])),
  };
  const payLink = key => (CONFIG.stripe && CONFIG.stripe[key]) || '';

  /* ------------------------------------------------------------ toasts -- */
  const region = $('#toasts');
  function toast(html, { href, label, ga = false, ms = 4200 } = {}) {
    if (!region) return;
    const t = document.createElement('div');
    t.className = 'toast' + (ga ? ' toast-ga' : '');
    t.innerHTML = html + (href ? ` <a href="${esc(href)}">${esc(label || 'View')}</a>` : '');
    region.append(t);
    setTimeout(() => t.remove(), ga ? 2800 : ms);
  }

  /* ---------------------------------------------- conversion tracking -- */
  // Live builds load GA4 (gtag.js) in <head>. Every call, text, form and sale
  // is sent as an event so the owner can see which pages bring in work.
  window.dataLayer = window.dataLayer || [];
  function track(name, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    else window.dataLayer.push({ event: name, ...params });
    if (document.documentElement.classList.contains('features-on')) {
      toast(`${icon('chart', 'icon-sm')} GA4 event sent: <code>${esc(name)}</code>`, { ga: true });
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h.startsWith('tel:')) track('phone_call_click', { link_location: a.dataset.loc || 'page' });
    else if (h.startsWith('sms:')) track('text_message_click', { link_location: a.dataset.loc || 'page' });
    else if (h.startsWith('mailto:')) track('email_click');
    else if (/google\.com\/maps|maps\.apple/.test(h)) track('directions_click');
  });

  /* ------------------------------------------------- presenter labels -- */
  const html = document.documentElement;
  const params = new URLSearchParams(location.search);
  if (params.get('labels') === 'on') store.set('bb-labels', true);
  if (params.get('labels') === 'off') store.set('bb-labels', false);
  const setLabels = on => {
    html.classList.toggle('features-on', on);
    $$('[data-features-toggle]').forEach(b => b.setAttribute('aria-pressed', String(on)));
  };
  setLabels(!!store.get('bb-labels', false));
  $$('[data-features-toggle]').forEach(b => b.addEventListener('click', () => {
    const on = !html.classList.contains('features-on');
    store.set('bb-labels', on);
    setLabels(on);
    toast(on ? 'Feature labels on: each highlighted box is something we can build.' : 'Feature labels off.');
  }));

  /* ---------------------------------------------------------- header -- */
  const menuBtn = $('[data-menu-btn]');
  const menu = $('#mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      $$('[data-menu-icon]', menuBtn).forEach(i => { i.hidden = i.dataset.menuIcon !== (open ? 'close' : 'open'); });
    });
  }
  const closeDropdowns = except => $$('[data-dropdown-btn]').forEach(b => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false');
    const p = document.getElementById(b.getAttribute('aria-controls'));
    if (p) p.hidden = true;
  });
  $$('[data-dropdown-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(btn);
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('[data-dropdown]')) closeDropdowns(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = $('[data-dropdown-btn][aria-expanded="true"]');
    if (open) { closeDropdowns(); open.focus(); }
  });

  /* ------------------------------------------------------------ cart -- */
  const CART_KEY = 'bb-cart';
  const cart = {
    items: () => store.get(CART_KEY, []),
    save(items) { store.set(CART_KEY, items); document.dispatchEvent(new CustomEvent('bb:cart')); },
    count() { return cart.items().reduce((n, i) => n + i.qty, 0); },
    add(item, { silent = false } = {}) {
      const items = cart.items();
      const found = !item.unique && items.find(i => i.key === item.key);
      if (found) found.qty = Math.min(99, found.qty + item.qty); else items.push(item);
      cart.save(items);
      track('add_to_cart', { currency: 'USD', value: item.price * item.qty, items: [{ item_id: item.id, item_name: item.name, item_variant: item.variant, price: item.price, quantity: item.qty }] });
      if (!silent) toast(`${icon('check', 'icon-sm')} Added ${esc(item.name)}`, { href: ROOT + 'cart.html', label: 'View cart' });
    },
    setQty(key, qty) { const items = cart.items(); const it = items.find(i => i.key === key); if (it) it.qty = Math.max(1, Math.min(99, qty)); cart.save(items); },
    remove(key) { cart.save(cart.items().filter(i => i.key !== key)); },
    clear() { cart.save([]); },
  };
  const paintCount = () => {
    const n = cart.count();
    $$('[data-cart-count]').forEach(el => { el.textContent = n > 99 ? '99+' : n; el.hidden = n === 0; });
    $$('[data-cart-link]').forEach(a => a.setAttribute('aria-label', n ? `Cart, ${n} item${n === 1 ? '' : 's'}` : 'Cart, empty'));
  };
  document.addEventListener('bb:cart', paintCount);
  window.addEventListener('storage', e => { if (e.key === CART_KEY) paintCount(); });
  paintCount();

  // Quick "Add to cart" buttons on product cards (needs catalog.js on the page).
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b || !window.BB_CATALOG) return;
    const p = window.BB_CATALOG.find(x => x.id === b.dataset.add);
    if (!p) return;
    const vi = Number(b.dataset.variant || 0);
    const v = p.variants ? p.variants[vi] : null;
    const price = v ? v[1] : (p.sale ?? p.price);
    cart.add({ key: p.id + ':' + vi, id: p.id, name: p.name, variant: v ? v[0] : '', price, qty: 1, img: `assets/img/product-${p.id}.svg`, ship: p.ship, href: `product.html?p=${p.id}` });
  });

  /* --------------------------------------------------------- dialogs -- */
  let lastOpener = null;
  function openDialog(d, opener) { lastOpener = opener || document.activeElement; d.showModal(); }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-dialog-open]');
    if (o) { const d = document.getElementById(o.dataset.dialogOpen); if (d) { e.preventDefault(); openDialog(d, o); } return; }
    const c = e.target.closest('[data-dialog-close]');
    if (c) { c.closest('dialog')?.close(); return; }
    if (e.target instanceof HTMLDialogElement) e.target.close(); // backdrop click
  });
  document.addEventListener('close', e => { if (e.target instanceof HTMLDialogElement && lastOpener?.isConnected) lastOpener.focus(); }, true);

  // Stand-in for Stripe hosted Checkout / Payment Links. A static site never
  // touches card numbers: the live button redirects to Stripe's own page.
  function stripeDemo({ title = 'Checkout', lines = [], total, note = '' }) {
    let d = $('#stripe-demo');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'stripe-demo';
      d.className = 'dialog';
      d.setAttribute('aria-labelledby', 'sd-title');
      document.body.append(d);
    }
    d.innerHTML = `
      <div class="stripe-bar">${icon('lock', 'icon-sm')} Secure checkout powered by Stripe · demo mode</div>
      <div class="dialog-body">
        <h2 id="sd-title" class="title-3">${esc(title)}</h2>
        <ul class="mt-4 divide-y divide-sand-200 text-sm">${lines.map(l => `<li class="flex justify-between gap-4 py-2"><span>${esc(l.label)}</span><span class="tabular">${money(l.amount)}</span></li>`).join('')}</ul>
        <p class="mt-2 flex justify-between border-t-2 border-basalt-900 pt-3 text-lg font-semibold"><span>Total</span><span class="tabular">${money(total)}</span></p>
        ${note ? `<p class="help mt-3">${note}</p>` : ''}
        <div class="mt-4 rounded-xl bg-juniper-50 p-4 text-sm text-juniper-900">
          <p class="font-semibold">On a live site this opens Stripe Checkout.</p>
          <p class="mt-1">Customers pay with a card, Apple Pay or Google Pay on Stripe's secure page. Card numbers never touch this website. Nothing is charged in this demo.</p>
        </div>
        <div class="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" class="btn btn-primary" data-sd-pay>${icon('check', 'icon-sm')} Simulate payment</button>
          <button type="button" class="btn btn-light" data-sd-cancel>Cancel</button>
        </div>
      </div>`;
    return new Promise(resolve => {
      const done = ok => { d.close(); resolve(ok); };
      $('[data-sd-pay]', d).addEventListener('click', () => done(true), { once: true });
      $('[data-sd-cancel]', d).addEventListener('click', () => done(false), { once: true });
      d.addEventListener('cancel', () => resolve(false), { once: true });
      track('begin_checkout', { currency: 'USD', value: total });
      openDialog(d);
    });
  }

  // Hands off to a real Stripe Payment Link. When the visitor has to type
  // something on Stripe's page (a custom amount, an invoice number), the note
  // stays up until they choose to continue instead of flashing past.
  function toStripe(link, { title = 'Checkout', note = '', email = '', ref = '' } = {}) {
    const u = new URL(link);
    if (email) u.searchParams.set('prefilled_email', String(email).trim());
    if (ref) u.searchParams.set('client_reference_id', String(ref).replace(/[^\w-]/g, '').slice(0, 200));
    if (!note) { location.href = u.href; return; }
    let d = $('#stripe-demo');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'stripe-demo';
      d.className = 'dialog';
      d.setAttribute('aria-labelledby', 'sd-title');
      document.body.append(d);
    }
    d.innerHTML = `
      <div class="stripe-bar">${icon('lock', 'icon-sm')} Secure checkout on Stripe · test mode</div>
      <div class="dialog-body">
        <h2 id="sd-title" class="title-3">${esc(title)}</h2>
        <p class="mt-3">${note}</p>
        <p class="help mt-2">Stripe's page opens in this tab. It's a test sandbox, so no real card is charged.</p>
        <div class="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a class="btn btn-primary" href="${esc(u.href)}">${icon('lock', 'icon-sm')} Continue to Stripe</a>
          <button type="button" class="btn btn-light" data-dialog-close>Cancel</button>
        </div>
      </div>`;
    openDialog(d);
  }

  /* ------------------------------------------------ calendar helpers -- */
  const pad = v => String(v).padStart(2, '0');
  const stamp = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  function ics({ title, start, minutes = 60, location = '', details = '' }) {
    const end = new Date(start.getTime() + minutes * 60000);
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bramble & Basalt//Demo//EN', 'BEGIN:VEVENT',
      `UID:${Date.now()}@brambleandbasalt.example`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${title}`, `LOCATION:${location.replace(/,/g, '\\,')}`, `DESCRIPTION:${details}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    a.download = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics';
    document.body.append(a); a.click(); a.remove();
    track('add_to_calendar', { event_title: title });
  }
  const gcal = ({ title, start, minutes = 60, location = '', details = '' }) => {
    const end = new Date(start.getTime() + minutes * 60000);
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${stamp(start)}/${stamp(end)}`, ctz: 'America/Denver', location, details });
  };
  const fmtDate = (d, o = { weekday: 'long', month: 'long', day: 'numeric' }) => d.toLocaleDateString('en-US', o);
  const fmtTime = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '');

  /* ---------------------------------------------------- open-now hours -- */
  // [open, close] in 24h hours, Sunday first. null = closed.
  const HOURS = {
    store: [[10, 16], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18]],
    cafe: [[8, 14], [7, 14], [7, 14], [7, 14], [7, 14], [7, 14], [7, 14]],
    office: [null, [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], null],
    yard: [null, [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], [8, 12]],
  };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const h12 = h => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
  function denverNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), mins: Number(parts.hour) * 60 + Number(parts.minute) };
  }
  function openState(which) {
    const hrs = HOURS[which];
    const { day, mins } = denverNow();
    const today = hrs[day];
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) return { open: true, text: `Open now · until ${h12(today[1])}` };
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7, h = hrs[d];
      if (!h || (i === 0 && mins >= h[0] * 60)) continue;
      const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAYS[d];
      return { open: false, text: `Closed · opens ${h12(h[0])} ${when}` };
    }
    return { open: false, text: 'Closed' };
  }
  $$('[data-open-now]').forEach(el => {
    const s = openState(el.dataset.openNow);
    el.dataset.openState = s.open ? 'open' : 'closed';
    const t = $('[data-open-text]', el);
    if (t) t.textContent = s.text;
  });

  /* ------------------------------------- lead source + call tracking -- */
  // Every form carries where the visitor came from, so the owner can see which ads
  // and pages bring in work. Visitors from an ad or flyer see that campaign's
  // tracking number; everyone else (and Google) sees the main number in the HTML.
  const src = (() => {
    const p = new URLSearchParams(location.search);
    let s = null;
    try {
      if (p.get('utm_source')) s = `${p.get('utm_source')} / ${p.get('utm_medium') || 'referral'}${p.get('utm_campaign') ? ' / ' + p.get('utm_campaign') : ''}`;
      else if (p.get('gclid')) s = 'google / cpc';
      else if (p.get('fbclid')) s = 'facebook / paid';
      else if (document.referrer && new URL(document.referrer).host !== location.host) s = new URL(document.referrer).host.replace(/^www\./, '') + ' / referral';
    } catch { /* malformed referrer */ }
    try { if (s) sessionStorage.setItem('bb-src', s); s = sessionStorage.getItem('bb-src') || s; } catch { /* storage blocked */ }
    s = s || '(direct) / none';
    if (!store.get('bb-first', null)) store.set('bb-first', { src: s, page: location.pathname });
    return s;
  })();
  const DNI = { google: ['+19705550187', '(970) 555-0187'], facebook: ['+19705550163', '(970) 555-0163'], flyer: ['+19705550171', '(970) 555-0171'] };
  const dni = DNI[src.split(' / ')[0]];
  if (dni) {
    $$('a[href="tel:+19705550142"], a[href^="sms:+19705550142"]').forEach(a => {
      a.href = a.getAttribute('href').replace('+19705550142', dni[0]);
      const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) w.currentNode.textContent = w.currentNode.textContent.replace('(970) 555-0142', dni[1]);
    });
    if (html.classList.contains('features-on')) setTimeout(() => toast(`${icon('phone', 'icon-sm')} Call tracking: visitors from <b>${esc(src.split(' / ')[0])}</b> see ${dni[1]}`, { ms: 6000 }), 600);
  }
  $$('form[data-demo-form], form[action*="formspree"]').forEach(f => {
    [['lead_source', src], ['first_touch', store.get('bb-first', {}).src || src], ['landing_page', store.get('bb-first', {}).page || location.pathname], ['page', location.pathname]].forEach(([n, v]) => {
      if (f.querySelector(`[name="${n}"]`)) return;
      const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.append(i);
    });
  });

  /* ------------------------------------------- conditional form fields -- */
  // <div data-show-when="minor=yes"> appears only when the form's "minor" field is
  // "yes". Hidden fields are disabled so they never block submission.
  const evalCond = form => $$('[data-show-when]', form).forEach(el => {
    const [name, vals] = el.dataset.showWhen.split('=');
    const field = form.elements[name];
    let v = '';
    if (field instanceof RadioNodeList) v = field.value;
    else if (field && field.type === 'checkbox') v = field.checked ? 'yes' : '';
    else if (field) v = field.value;
    const on = vals.split(',').includes(v);
    el.hidden = !on;
    $$('input,select,textarea,button', el).forEach(i => { i.disabled = !on; });
  });
  $$('form').forEach(f => { if ($('[data-show-when]', f)) { f.addEventListener('change', () => evalCond(f)); f.addEventListener('input', () => evalCond(f)); evalCond(f); } });

  /* ---------------------------------------------------- saved items -- */
  const WISH = 'bb-wish';
  const paintWish = () => {
    const w = store.get(WISH, []);
    $$('[data-wish]').forEach(b => b.setAttribute('aria-pressed', String(w.includes(b.dataset.wish))));
    $$('[data-wish-count]').forEach(el => { el.textContent = w.length; });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-wish]');
    if (!b) return;
    const w = store.get(WISH, []), id = b.dataset.wish, on = !w.includes(id);
    store.set(WISH, on ? [...w, id] : w.filter(x => x !== id));
    paintWish();
    document.dispatchEvent(new CustomEvent('bb:wish'));
    if (on) { toast(`${icon('heart', 'icon-sm')} Saved for later`, { href: ROOT + 'wishlist.html', label: 'View saved' }); track('add_to_wishlist', { item_id: id }); }
  });
  paintWish();

  /* ---------------------------------- print, consent preview, misc -- */
  document.addEventListener('click', e => {
    if (e.target.closest('[data-print]')) { track('print', { page: location.pathname }); window.print(); }
    if (e.target.closest('[data-consent-preview]')) { e.preventDefault(); showConsent(); }
    const c = e.target.closest('[data-consent]');
    if (c) {
      store.set('bb-consent', c.dataset.consent);
      c.closest('.consent').remove();
      if (c.dataset.consent === 'all') window.bbLoadGA?.();
      else if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' });
      toast(c.dataset.consent === 'all' ? 'Analytics allowed. GA4 is on for this visitor.' : 'Declined. Analytics stays off for this visitor.');
    }
  });
  function showConsent() {
    if ($('.consent')) return;
    const c = document.createElement('div');
    c.className = 'consent on-dark';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-labelledby', 'consent-h');
    c.innerHTML = `<p id="consent-h" class="font-semibold text-white">Cookies for analytics only</p>
      <p class="mt-1 text-sm">We count visits to learn which pages help customers. Nothing is sold or used for ads, and it stays off unless you allow it.</p>
      <div class="mt-4 flex flex-wrap items-center gap-2"><button type="button" class="btn btn-accent btn-sm" data-consent="all">Allow analytics</button><button type="button" class="btn btn-ghost-dark btn-sm" data-consent="none">Decline</button><a class="link text-sm" href="${ROOT}privacy.html">Privacy policy</a></div>`;
    document.body.append(c);
    $('button', c).focus();
  }
  const roleParam = new URLSearchParams(location.search).get('role');
  if (roleParam && $('#ap-role')) $('#ap-role').value = roleParam;

  // Offline support: pages a visitor has opened keep working with no signal.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register(ROOT + 'sw.js').catch(() => {}));
  }

  /* ------------------------------------------------------------ forms -- */
  // With CONFIG.formspree set, every form lands in the business inbox through
  // Formspree. File uploads need a paid Formspree plan, so files are listed by
  // name instead, and a drawn signature (a PNG data URL) is noted, not pasted
  // into the email. Without it, nothing leaves the browser.
  async function sendLead(name, data) {
    if (!CONFIG.formspree) return true;
    const fd = data instanceof FormData ? data : Object.entries(data).reduce((x, [k, v]) => { x.append(k, v); return x; }, new FormData());
    const files = [];
    for (const [k, v] of [...fd.entries()]) {
      if (v instanceof File) { if (v.name) files.push(v.name); fd.delete(k); }
      else if (v.startsWith('data:image/')) fd.set(k, 'drawn on screen');
    }
    if (files.length) fd.append('files_named', files.join(', '));
    fd.append('form_name', name);
    fd.append('_subject', `Demo site: ${name.replace(/-/g, ' ')}`);
    if (!fd.has('lead_source')) fd.append('lead_source', src);
    if (!fd.has('page')) fd.append('page', location.pathname);
    try {
      const r = await fetch(`https://formspree.io/f/${CONFIG.formspree}`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      return r.ok;
    } catch { return false; }
  }
  const FAIL = `That didn't go through. Please try again, or call <a href="tel:+19705550142">(970) 555-0142</a>.`;
  function sendFailed(form) {
    form = form || $('dialog[open] form:not([hidden])');
    if (!form) { toast(FAIL, { ms: 15000 }); return; }
    let box = $('[data-form-error]', form);
    if (!box) {
      box = document.createElement('p');
      box.dataset.formError = '';
      box.className = 'error-text sm:col-span-2';
      box.setAttribute('role', 'alert');
      form.append(box);
    }
    box.textContent = '';
    setTimeout(() => { box.innerHTML = FAIL; }, 50); // filled after insert so it is announced
  }
  // A new attempt clears the last failure message.
  document.addEventListener('submit', e => { $('[data-form-error]', e.target)?.remove(); }, true);

  $$('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      for (const f of $$('input[type="file"][data-max-mb]', form)) {
        const max = Number(f.dataset.maxMb) * 1048576;
        const big = [...(f.files || [])].find(x => x.size > max);
        if (big) { toast(`${esc(big.name)} is over ${f.dataset.maxMb} MB. Try a smaller file.`); f.focus(); return; }
      }
      if (html.classList.contains('features-on')) toast(`${icon('chart', 'icon-sm')} Lead source attached: <code>${esc(src)}</code>`, { ga: true });
      const data = new FormData(form);
      const btn = form.querySelector('[type="submit"]'), label = btn && btn.innerHTML;
      if (btn?.getAttribute('aria-disabled') === 'true') return;
      if (CONFIG.formspree && btn) { btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Sending…'; }
      const sent = await sendLead(form.dataset.demoForm, new FormData(form));
      if (btn) { btn.removeAttribute('aria-disabled'); btn.innerHTML = label; }
      if (!sent) { sendFailed(form); return; }
      if (form.dataset.redirect) { track(form.dataset.event || 'generate_lead', { form_name: form.dataset.demoForm, lead_source: src }); location.href = ROOT + form.dataset.redirect; return; }
      const first = String(data.get('name') || data.get('first') || '').trim().split(/\s+/)[0];
      const ok = form.dataset.success ? document.getElementById(form.dataset.success) : form.parentElement.querySelector('[data-form-success]');
      if (ok) {
        $$('[data-fill]', ok).forEach(el => { const v = el.dataset.fill === 'first' ? first : data.get(el.dataset.fill); el.textContent = v ? String(v) : el.textContent; });
        form.hidden = true; ok.hidden = false; ok.focus({ preventScroll: false });
      } else {
        toast(`${icon('check', 'icon-sm')} Thanks! You're on the list.`);
        form.reset();
      }
      track(form.dataset.event || 'generate_lead', { form_name: form.dataset.demoForm, lead_source: src });
    });
  });
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-form-reset]');
    if (!r) return;
    const ok = r.closest('[data-form-success]');
    const form = ok.parentElement.querySelector('form[data-demo-form]') || document.querySelector(`form[data-success="${ok.id}"]`);
    ok.hidden = true;
    if (form) { form.reset(); form.hidden = false; form.querySelector('input,select,textarea')?.focus(); }
  });

  /* -------------------------------------------- before / after slider -- */
  $$('.ba input[type="range"]').forEach(r => {
    const set = () => r.closest('.ba').style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  /* ------------------------------------------- lazy embeds (facades) -- */
  document.addEventListener('click', e => {
    const v = e.target.closest('[data-video]');
    if (v) {
      const box = document.createElement('div');
      box.className = 'video-facade grid place-items-center p-6 text-center text-white';
      box.innerHTML = `<div><p class="font-display text-2xl">Your video plays here</p><p class="mt-2 text-sm text-basalt-200">YouTube or Vimeo loads only after a visitor taps play, so the page stays fast on a phone.</p></div>`;
      v.replaceWith(box);
      track('video_start', { video_title: v.dataset.video });
    }
    const m = e.target.closest('[data-map]');
    if (m) {
      const f = document.createElement('iframe');
      f.title = 'Map of the Grand Junction area';
      f.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-108.78%2C38.99%2C-108.33%2C39.17&layer=mapnik';
      f.className = 'h-full w-full border-0';
      f.loading = 'lazy';
      m.replaceWith(f);
      f.focus();
    }
  });

  /* --------------------------------------------- service-area checker -- */
  const ZIPS = { 81501: 'Grand Junction', 81502: 'Grand Junction', 81503: 'Grand Junction & Orchard Mesa', 81504: 'Clifton & Grand Junction', 81505: 'Grand Junction', 81506: 'Grand Junction', 81507: 'Redlands', 81520: 'Clifton', 81521: 'Fruita', 81524: 'Loma', 81525: 'Mack', 81526: 'Palisade', 81527: 'Whitewater' };
  $$('form[data-zip-check]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const zip = String(new FormData(f).get('zip') || '').trim();
    const out = $('[data-zip-result]', f.parentElement);
    if (!/^\d{5}$/.test(zip)) { out.innerHTML = `<span class="error-text">Enter a 5-digit ZIP code.</span>`; return; }
    out.innerHTML = ZIPS[zip]
      ? `<span class="font-semibold text-juniper-800">${icon('check', 'icon-sm inline')} Yes, we serve ${esc(ZIPS[zip])} (${zip}).</span> <a class="link" href="${ROOT}book.html">Book a free estimate</a>`
      : `<span class="font-semibold">${zip} is outside our usual route.</span> Larger projects often still work. <a class="link" href="tel:+19705550142">Call (970) 555-0142</a>`;
    track('service_area_check', { zip_in_area: !!ZIPS[zip] });
  }));

  /* ------------------------------------------------------ FAQ search -- */
  $$('[data-faq-search]').forEach(input => {
    const list = document.getElementById(input.getAttribute('aria-controls'));
    const count = $('[data-faq-count]');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      $$('.faq-item', list).forEach(d => { const hit = !q || d.textContent.toLowerCase().includes(q); d.hidden = !hit; if (hit) shown++; if (q && hit) d.open = true; if (!q) d.open = false; });
      $$('[data-faq-group]', list).forEach(g => { g.hidden = !$$('.faq-item', g).some(d => !d.hidden); });
      if (count) count.textContent = q ? `${shown} answer${shown === 1 ? '' : 's'} match “${input.value.trim()}”` : '';
      $('[data-faq-empty]', list.parentElement).hidden = shown > 0;
    });
  });

  // Deep links: faq.html#warranty (from site search or a shared link) opens that answer.
  const openFromHash = () => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const d = id && document.getElementById(id);
    if (d instanceof HTMLDetailsElement) d.open = true;
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ------------------------------------------------- generic filters -- */
  // <div data-filter-group="gallery"> <button class="pill" data-filter="all"> …
  // items: [data-filter-items="gallery"] > [data-tags="patio lighting"]
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-filter-group] [data-filter]');
    if (!b) return;
    const group = b.closest('[data-filter-group]');
    const name = group.dataset.filterGroup, val = b.dataset.filter;
    $$('[data-filter]', group).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    let shown = 0;
    $$(`[data-filter-items="${name}"] > [data-tags]`).forEach(it => { const hit = val === 'all' || it.dataset.tags.split(' ').includes(val); it.hidden = !hit; if (hit) shown++; });
    const c = $(`[data-filter-count="${name}"]`);
    if (c) c.textContent = `${shown} shown`;
  });

  /* ------------------------------------------------ plan billing toggle -- */
  $$('[data-billing]').forEach(b => b.addEventListener('click', () => {
    const mode = b.dataset.billing;
    $$('[data-billing]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-price-monthly]').forEach(el => { el.textContent = mode === 'season' ? el.dataset.priceSeason : el.dataset.priceMonthly; });
    $$('[data-billing-note]').forEach(el => { el.hidden = el.dataset.billingNote !== mode; });
  }));

  // Plan sign-up buttons open the Stripe stand-in (live: a Stripe Payment Link per plan).
  $$('[data-plan]').forEach(b => b.addEventListener('click', async () => {
    const season = $('[data-billing="season"]')?.getAttribute('aria-pressed') === 'true';
    const monthly = +b.dataset.planPrice;
    const total = season ? Math.round(monthly * 8 * 0.9) : monthly;
    const link = payLink(`plan-${b.dataset.plan.toLowerCase().replace(/\W+/g, '-')}-${season ? 'season' : 'monthly'}`);
    if (link) { track('begin_checkout', { value: total, currency: 'USD', item_category: 'subscription', item_name: b.dataset.plan }); location.href = link; return; }
    const paid = await stripeDemo({
      title: `${b.dataset.plan} yard care plan`,
      lines: [{ label: season ? `${b.dataset.plan}, April–November, prepaid (10% off)` : `${b.dataset.plan}, first month`, amount: total }],
      total,
      note: season ? 'One payment for the whole season.' : 'Renews monthly through November. Pause or cancel anytime.',
    });
    if (paid) {
      track('purchase', { value: total, currency: 'USD', item_category: 'subscription', item_name: b.dataset.plan });
      toast(`${icon('check', 'icon-sm')} Welcome aboard! Your ${esc(b.dataset.plan)} crew will text to set your weekly day.`, { ms: 6000 });
    }
  }));

  // Careers: "Apply for this role" fills the form's position and scrolls to it.
  $$('[data-apply]').forEach(b => b.addEventListener('click', () => {
    const sel = $('#ap-role');
    if (!sel) return;
    sel.value = b.dataset.apply;
    $('#apply').scrollIntoView({ behavior: 'smooth' });
    sel.focus({ preventScroll: true });
  }));

  /* --------------------------------------------------------- countdowns -- */
  // <div data-countdown="2027-03-14T09:00:00-06:00"> with [data-cd="d|h|m|s"] inside.
  // Only ever counts to a real date: no fake "offer ends" timers.
  const countdowns = () => $$('[data-countdown]').forEach(el => {
    if (el.dataset.cdOn) return;
    el.dataset.cdOn = '1';
    const end = new Date(el.dataset.countdown).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.entries(v).forEach(([k, n]) => { const b = $(`[data-cd="${k}"]`, el); if (b) b.textContent = n; });
      if (s > 0) setTimeout(tick, 1000);
    };
    tick();
  });
  countdowns();

  /* ------------------------------------------- simple pay forms -- */
  // <form data-pay="Title"> with an "amount" radio group (or "custom" + name="custom").
  // Live builds point each one at a Stripe Payment Link that lets the customer choose the amount.
  $$('form[data-pay]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(f);
    const amt = Math.round(+(d.get('amount') === 'custom' ? d.get('custom') : d.get('amount')) * 100) / 100;
    if (!(amt >= 1)) { toast('Enter an amount of at least $1.'); return; }
    const link = f.dataset.payKey && payLink(f.dataset.payKey);
    if (link) { track('begin_checkout', { value: amt, currency: 'USD', item_category: f.dataset.payCategory || 'payment' }); toStripe(link, { title: f.dataset.pay, note: `Enter <b>${money(amt)}</b> as the amount on Stripe's page.`, email: d.get('email') || '' }); return; }
    const paid = await stripeDemo({ title: f.dataset.pay, lines: [{ label: f.dataset.payLine || f.dataset.pay, amount: amt }], total: amt, note: f.dataset.payNote || '' });
    if (!paid) return;
    track('purchase', { value: amt, currency: 'USD', item_category: f.dataset.payCategory || 'payment' });
    const ok = f.parentElement.querySelector('[data-form-success]');
    if (ok) { $$('[data-fill="amount"]', ok).forEach(x => { x.textContent = money(amt); }); f.hidden = true; ok.hidden = false; ok.focus(); }
  }));

  // Buttons that stand in for a third-party screen (billing portal, social feed…).
  document.addEventListener('click', e => {
    const x = e.target.closest('[data-explain]');
    if (x) { e.preventDefault(); toast(esc(x.dataset.explain), { ms: 7000 }); track('demo_explain', { feature: x.dataset.explainFeature || '' }); }
    const a = e.target.closest('a[href$=".pdf"]');
    if (a) track('file_download', { file_name: a.getAttribute('href').split('/').pop() });
  });

  // Arriving from a friend's referral link.
  const ref = new URLSearchParams(location.search).get('ref');
  if (ref && /^[A-Z0-9]{3,12}$/i.test(ref)) {
    store.set('bb-ref', ref.toUpperCase());
    setTimeout(() => toast(`${icon('gift', 'icon-sm')} A friend sent you $50 off your first project. Code <b>${esc(ref.toUpperCase())}</b> is saved.`, { href: ROOT + 'book.html?service=estimate', label: 'Book', ms: 8000 }), 500);
    track('referral_visit', { code: ref.toUpperCase() });
  }

  // Thank-you page: the message matches the form that sent the visitor here.
  const thanks = $('#thanks-root');
  if (thanks) {
    const from = new URLSearchParams(location.search).get('form') || 'contact';
    const MSG = { 'fall-reset': ['Your Fall Yard Reset is requested.', 'We’ll text within one business day to lock in your date.'], contact: ['Your message is in.', 'We reply within one business day, usually much sooner.'], paid: ['Payment received. Thank you!', 'This was a Stripe test payment, so no real card was charged.'] };
    const T = Object.hasOwn(MSG, from) ? MSG[from] : ['Thanks, you’re all set.', 'We’ll be in touch within one business day.'];
    $('[data-thanks-title]', thanks).textContent = T[0];
    $('[data-thanks-sub]', thanks).textContent = T[1];
    track('thank_you_view', { form_name: from });
    // Stripe Payment Links redirect here with ?form=paid&item=<CONFIG.stripe key>.
    if (from === 'paid') $('[data-thanks-steps]', thanks)?.setAttribute('hidden', '');
    if (from === 'paid') track('purchase', { currency: 'USD', item_name: new URLSearchParams(location.search).get('item') || '' });
  }

  /* --------------------------------------------------- share & copy -- */
  document.addEventListener('click', async e => {
    const s = e.target.closest('[data-share]');
    if (s) {
      const data = { title: document.title, url: location.href };
      if (navigator.share) { try { await navigator.share(data); track('share', { method: 'native' }); } catch { /* dismissed */ } }
      else { try { await navigator.clipboard.writeText(location.href); toast('Link copied to your clipboard.'); track('share', { method: 'copy_link' }); } catch { toast('Copy this page address from the address bar.'); } }
    }
    const c = e.target.closest('[data-copy]');
    if (c) { try { await navigator.clipboard.writeText(c.dataset.copy); toast(`Copied <b>${esc(c.dataset.copy)}</b>`); } catch { toast(`Code: <b>${esc(c.dataset.copy)}</b>`); } }
  });

  window.BB = { $, $$, esc, money, icon, store, toast, track, cart, stripeDemo, openDialog, ics, gcal, fmtDate, fmtTime, ROOT, HOURS, h12, denverNow, paintWish, src, evalCond, openState, countdowns, CONFIG, payLink, toStripe, sendLead, sendFailed };
})();
