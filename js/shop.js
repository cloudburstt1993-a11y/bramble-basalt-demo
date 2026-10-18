/* Bramble & Basalt demo: shop grid filters, product page, cart + checkout, gift cards.
   Needs main.js (window.BB) and catalog.js (window.BB_CATALOG). */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, store, toast, track, cart, stripeDemo } = window.BB;
  const CATALOG = window.BB_CATALOG || [];
  const CATS = window.BB_CATS || {};
  const byId = id => CATALOG.find(p => p.id === id);

  /* ======================================================= shop grid == */
  const grid = $('#shop-grid');
  if (grid) {
    const search = $('#shop-search'), sort = $('#shop-sort'), inStock = $('#shop-instock'), count = $('#shop-count'), empty = $('#shop-empty');
    const cards = $$('[data-product]', grid);
    const qs = new URLSearchParams(location.search);
    let cat = qs.get('cat') && (CATS[qs.get('cat')] ? qs.get('cat') : 'all') || 'all';
    if (qs.get('q')) search.value = qs.get('q');

    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const hit = (cat === 'all' || c.dataset.cat === cat) && (!q || c.dataset.name.includes(q)) && (!inStock.checked || c.dataset.instock === '1');
        c.hidden = !hit; if (hit) shown++;
      });
      const key = { featured: c => +c.dataset.order, 'price-asc': c => +c.dataset.price, 'price-desc': c => -c.dataset.price, name: c => c.dataset.name };
      const k = key[sort.value];
      cards.slice().sort((a, b) => { const x = k(a), y = k(b); return x < y ? -1 : x > y ? 1 : 0; }).forEach(c => grid.append(c));
      $$('[data-shop-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.shopCat === cat)));
      count.textContent = `${shown} product${shown === 1 ? '' : 's'}${cat !== 'all' ? ' in ' + CATS[cat] : ''}${q ? ` matching “${search.value.trim()}”` : ''}`;
      empty.hidden = shown > 0;
      const u = new URL(location.href);
      cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat);
      q ? u.searchParams.set('q', search.value.trim()) : u.searchParams.delete('q');
      history.replaceState(null, '', u);
    };
    $$('[data-shop-cat]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.shopCat; apply(); }));
    let t; search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { apply(); if (search.value.trim()) track('search', { search_term: search.value.trim() }); }, 250); });
    $('#shop-search-form')?.addEventListener('submit', e => { e.preventDefault(); apply(); });
    sort.addEventListener('change', apply);
    inStock.addEventListener('change', apply);
    $$('[data-shop-clear]').forEach(b => b.addEventListener('click', () => { cat = 'all'; search.value = ''; inStock.checked = false; sort.value = 'featured'; apply(); search.focus(); }));
    apply();
  }

  /* ==================================================== product page == */
  const pRoot = $('#product-root');
  if (pRoot) {
    const id = new URLSearchParams(location.search).get('p') || 'blue-grama';
    const p = byId(id) || CATALOG[0];
    const inStock = p.stock !== false;
    const scene = { plants: 'scene-path', pottery: 'scene-pond', tools: 'scene-beds', soil: 'scene-beds', gifts: 'cafe-hero' }[p.cat];
    const views = [
      { src: `assets/img/product-${p.id}.svg`, alt: p.name, cls: '' },
      { src: `assets/img/product-${p.id}.svg`, alt: `${p.name}, close-up`, cls: 'scale-150' },
      { src: `assets/img/${scene}.svg`, alt: 'Styled in a Western Slope garden', cls: '' },
    ];
    document.title = `${p.name} | Bramble & Basalt Garden Co.`;
    const variants = p.variants || [];
    const priceOf = i => variants.length ? variants[i][1] : (p.sale ?? p.price);
    const shipNote = p.ship === 'local'
      ? `${icon('info', 'icon-sm')} Live plants and bulk goods are pickup or local delivery only.`
      : `${icon('package', 'icon-sm')} Ships anywhere in the US in 2–4 business days.`;

    pRoot.innerHTML = `
      <nav aria-label="Breadcrumb" class="text-sm text-basalt-600">
        <ol class="flex flex-wrap items-center gap-1.5">
          <li><a class="hover:underline" href="index.html">Home</a></li><li aria-hidden="true">/</li>
          <li><a class="hover:underline" href="shop.html">Shop</a></li><li aria-hidden="true">/</li>
          <li><a class="hover:underline" href="shop.html?cat=${p.cat}">${CATS[p.cat]}</a></li><li aria-hidden="true">/</li>
          <li aria-current="page" class="font-semibold text-basalt-900">${esc(p.name)}</li>
        </ol>
      </nav>
      <div class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div data-feature="Product photo gallery">
          <div class="frame aspect-square">
            <img id="pd-main" src="${views[0].src}" alt="${esc(views[0].alt)}" width="600" height="600" class="transition-transform duration-300" fetchpriority="high">
          </div>
          <div class="mt-3 grid grid-cols-3 gap-3" role="group" aria-label="Product images">
            ${views.map((v, i) => `<button type="button" class="frame aspect-square ring-offset-2 aria-pressed:ring-2 aria-pressed:ring-juniper-700" aria-pressed="${i === 0}" aria-label="Show image ${i + 1} of 3" data-view="${i}"><img src="${v.src}" alt="" width="600" height="600" loading="lazy" class="${v.cls}"></button>`).join('')}
          </div>
        </div>
        <div>
          <p class="eyebrow">${CATS[p.cat]}</p>
          <h1 class="title-2 mt-2">${esc(p.name)}</h1>
          <p class="mt-3 flex items-center gap-2 text-sm"><span class="stars" aria-hidden="true">${icon('star').repeat(5)}</span><a href="#reviews" class="link">Customer reviews</a> <span class="sample-tag">Sample</span></p>
          <p class="mt-4 text-2xl" id="pd-price">${p.sale ? `<span class="price price-sale">${money(p.sale)}</span> <span class="price-was text-lg">${money(p.price)}</span>` : `<span class="price">${money(priceOf(0))}</span>`}</p>
          <p class="lead mt-4">${esc(p.short)}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">${window.bbBadgeHTML({ badges: p.badges })}</div>
          ${inStock ? `
          <form id="pd-form" class="mt-6 grid gap-5" data-feature="Variants + add to cart">
            ${variants.length > 1 ? `<fieldset><legend class="label">${p.cat === 'tools' ? 'Size' : p.cat === 'gifts' ? 'Option' : 'Size'}</legend>
              <div class="mt-2 flex flex-wrap gap-2">${variants.map((v, i) => `<label class="choice items-center px-4 py-2.5"><input type="radio" name="variant" value="${i}" ${i === 0 ? 'checked' : ''}><span class="font-semibold">${esc(v[0])}</span>${variants.some(x => x[1] !== variants[0][1]) ? `<span class="muted text-sm">${money(v[1])}</span>` : ''}</label>`).join('')}</div></fieldset>` : variants.length === 1 ? `<p class="text-sm"><span class="font-semibold">Size:</span> ${esc(variants[0][0])}</p>` : ''}
            <div class="flex flex-wrap items-end gap-3">
              <div class="field"><label class="label" for="pd-qty">Quantity</label>
                <div class="stepper"><button type="button" aria-label="Decrease quantity" data-step="-1">${icon('minus', 'icon-sm')}</button><input id="pd-qty" type="number" inputmode="numeric" min="1" max="99" value="1"><button type="button" aria-label="Increase quantity" data-step="1">${icon('plus', 'icon-sm')}</button></div>
              </div>
              <button type="submit" class="btn btn-primary btn-lg flex-1">${icon('cart')} Add to cart</button>
              <button type="button" class="btn btn-light btn-lg" data-wish="${p.id}" aria-pressed="false">${icon('heart', 'icon-sm fill-when-pressed')} Save</button>
            </div>
          </form>` : `
          <div id="notify" class="mt-6 rounded-2xl border border-sand-300 bg-white p-5" data-feature="Back-in-stock alerts">
            <p class="font-semibold">Out of stock right now</p>
            <p class="help mt-1">Leave your email and we'll let you know the day it's back.</p>
            <form class="mt-3 flex flex-col gap-2 sm:flex-row" data-demo-form="back-in-stock" data-event="back_in_stock_signup">
              <label class="sr-only" for="notify-email">Email</label>
              <input id="notify-email" class="input" type="email" name="email" required autocomplete="email" placeholder="you@example.com">
              <button class="btn btn-primary shrink-0" type="submit">Notify me</button>
            </form>
            <p class="mt-3 font-semibold text-juniper-800" data-form-success tabindex="-1" hidden>${icon('check', 'icon-sm inline')} You're on the list. We'll email you when it's back.</p>
          </div>`}
          <ul class="mt-6 grid gap-2 text-sm">
            <li class="flex items-center gap-2">${icon('store', 'icon-sm')} <span><b>Free pickup</b> at the garden center, usually ready in 2 hours</span></li>
            <li class="flex items-center gap-2">${icon('truck', 'icon-sm')} <span><b>Local delivery</b> $25, free over $150</span></li>
            <li class="flex items-center gap-2">${shipNote}</li>
          </ul>
          <dl class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-sand-200 bg-sand-200 text-sm">
            ${Object.entries(p.specs).map(([k, v]) => `<div class="bg-white p-3"><dt class="text-basalt-600">${esc(k)}</dt><dd class="font-semibold">${esc(v)}</dd></div>`).join('')}
          </dl>
          <div class="mt-6">
            <details class="faq-item"><summary>${p.cat === 'plants' ? 'Planting & care' : 'Care & use'}</summary><div class="faq-a">${p.cat === 'plants'
              ? 'Plant in fall or spring, water deeply once a week for the first summer, then taper off. Our staff will happily walk you through it at pickup.'
              : 'Everything we sell is something our own crew uses or our team has tested in a Grand Junction summer. Questions? Text us a photo.'}</div></details>
            <details class="faq-item"><summary>Returns & guarantee</summary><div class="faq-a">Unused goods can be returned within 30 days. Plants carry a 1-year guarantee when planted per our care card. Just bring your receipt.</div></details>
          </div>
        </div>
      </div>`;

    const main = $('#pd-main');
    $$('[data-view]', pRoot).forEach(b => b.addEventListener('click', () => {
      const v = views[+b.dataset.view];
      main.src = v.src; main.alt = v.alt; main.className = 'transition-transform duration-300 ' + v.cls;
      $$('[data-view]', pRoot).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
    const form = $('#pd-form');
    if (form) {
      const qty = $('#pd-qty');
      $$('[data-step]', form).forEach(b => b.addEventListener('click', () => { qty.value = Math.max(1, Math.min(99, (+qty.value || 1) + +b.dataset.step)); }));
      form.addEventListener('change', e => {
        if (e.target.name !== 'variant' || p.sale) return;
        $('#pd-price').innerHTML = `<span class="price">${money(priceOf(+e.target.value))}</span>`;
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const vi = +(new FormData(form).get('variant') || 0);
        cart.add({ key: p.id + ':' + vi, id: p.id, name: p.name, variant: variants[vi] ? variants[vi][0] : '', price: priceOf(vi), qty: Math.max(1, Math.min(99, +qty.value || 1)), img: `assets/img/product-${p.id}.svg`, ship: p.ship, href: `product.html?p=${p.id}` });
      });
    } else {
      // The notify form was injected after main.js wired forms, so wire it here.
      const nf = $('form[data-demo-form]', pRoot);
      nf.addEventListener('submit', e => { e.preventDefault(); nf.hidden = true; const ok = $('[data-form-success]', pRoot); ok.hidden = false; ok.focus(); track('back_in_stock_signup', { item_id: p.id }); });
    }
    track('view_item', { currency: 'USD', value: priceOf(0), items: [{ item_id: p.id, item_name: p.name }] });

    const rel = $('#related-grid');
    if (rel) {
      const pool = CATALOG.filter(x => x.id !== p.id);
      const same = pool.filter(x => x.cat === p.cat), other = pool.filter(x => x.cat !== p.cat);
      rel.innerHTML = [...same, ...other].slice(0, 4).map((x, i) => window.bbCard(x, i)).join('');
    }
    store.set('bb-recent', [p.id, ...store.get('bb-recent', []).filter(x => x !== p.id)].slice(0, 8));
    window.BB.paintWish();
  }

  /* ============================================================ cart == */
  const cRoot = $('#cart-root');
  if (cRoot) {
    const OPTS = 'bb-cart-opts';
    const PROMOS = {
      FALL10: { label: '10% off merchandise', calc: m => m * 0.10 },
      BLOOM5: { label: '$5 off orders $40+', calc: m => (m >= 40 ? 5 : 0), min: 40 },
    };
    const opts = () => ({ ship: 'pickup', promo: '', ...store.get(OPTS, {}) });
    const setOpts = o => { store.set(OPTS, { ...opts(), ...o }); render(); };

    const totals = items => {
      const o = opts();
      const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
      const merch = items.filter(i => i.ship !== 'digital').reduce((s, i) => s + i.price * i.qty, 0);
      const physical = items.some(i => i.ship !== 'digital');
      const local = items.some(i => i.ship === 'local');
      let ship = physical ? o.ship : 'none';
      if (ship === 'ship' && local) ship = 'pickup';
      const promo = PROMOS[o.promo];
      const discount = promo ? Math.min(merch, promo.calc(merch)) : 0;
      const fee = ship === 'delivery' ? (merch >= 150 ? 0 : 25) : ship === 'ship' ? (merch >= 75 ? 0 : 9.95) : 0;
      return { sub, merch, discount, fee, ship, local, physical, total: Math.max(0, sub - discount + fee) };
    };

    function render() {
      const items = cart.items();
      if (!items.length) {
        cRoot.innerHTML = `
          <div class="mx-auto max-w-md py-10 text-center">
            <img src="assets/img/product-terracotta-bowl.svg" alt="" width="600" height="600" class="mx-auto w-48 rounded-full">
            <h2 class="title-2 mt-6">Your cart is empty</h2>
            <p class="muted mt-2">Plants, pottery, tools and gift cards, ready for pickup today.</p>
            <div class="mt-6 flex flex-wrap justify-center gap-3"><a class="btn btn-primary" href="shop.html">Shop the garden center</a><a class="btn btn-outline" href="gift-cards.html">Send a gift card</a></div>
          </div>`;
        return;
      }
      const o = opts(), t = totals(items);
      const shipChoice = (val, title, sub, disabled) => `<label class="choice"><input type="radio" name="ship" value="${val}" ${t.ship === val ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="flex-1"><span class="block font-semibold">${title}</span><span class="help">${sub}</span></span></label>`;
      cRoot.innerHTML = `
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
          <div>
            <ul class="card divide-y divide-sand-200" aria-label="Items in your cart">
              ${items.map(i => `
              <li class="flex gap-4 p-4">
                <a href="${esc(i.href)}" class="frame size-20 shrink-0 sm:size-24" tabindex="-1" aria-hidden="true"><img src="${esc(i.img)}" alt="" width="600" height="600"></a>
                <div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <a href="${esc(i.href)}" class="font-semibold hover:underline">${esc(i.name)}</a>
                    ${i.variant ? `<p class="help">${esc(i.variant)}</p>` : ''}
                    ${i.ship === 'local' ? '<p class="help">Pickup or local delivery</p>' : i.ship === 'digital' ? '<p class="help">Emailed instantly</p>' : ''}
                    <p class="mt-1 text-sm tabular">${money(i.price)} each</p>
                  </div>
                  <div class="flex items-center gap-3 sm:flex-col sm:items-end">
                    ${i.ship === 'digital' ? '<span class="help">Qty 1</span>' : `<div class="stepper" role="group" aria-label="Quantity for ${esc(i.name)}"><button type="button" aria-label="Decrease" data-qty="${esc(i.key)}" data-d="-1">${icon('minus', 'icon-sm')}</button><span class="w-8 text-center font-semibold tabular" aria-live="polite">${i.qty}</span><button type="button" aria-label="Increase" data-qty="${esc(i.key)}" data-d="1">${icon('plus', 'icon-sm')}</button></div>`}
                    <p class="price tabular">${money(i.price * i.qty)}</p>
                    <button type="button" class="text-sm text-basalt-600 underline hover:text-danger-700" data-remove="${esc(i.key)}">Remove<span class="sr-only"> ${esc(i.name)}</span></button>
                  </div>
                </div>
              </li>`).join('')}
            </ul>
            <a href="shop.html" class="link mt-4 inline-flex items-center gap-1">${icon('chevron-left', 'icon-sm')} Keep shopping</a>
          </div>

          <aside class="card p-5 lg:sticky lg:top-24" aria-labelledby="sum-h">
            <h2 id="sum-h" class="title-3">Order summary</h2>
            ${t.physical ? `
            <fieldset class="mt-4" data-feature="Pickup, delivery or shipping">
              <legend class="label">How would you like it?</legend>
              <div class="mt-2 grid gap-2">
                ${shipChoice('pickup', 'Free store pickup', 'Ready in about 2 hours at 2210 Basalt Bend Rd')}
                ${shipChoice('delivery', 'Local delivery', t.merch >= 150 ? 'Free on this order · Grand Junction area' : '$25 · free over $150 · Grand Junction area')}
                ${shipChoice('ship', 'Ship it', t.local ? 'Not available for live plants or bulk items' : (t.merch >= 75 ? 'Free on this order · 2–4 business days' : '$9.95 · free over $75'), t.local)}
              </div>
            </fieldset>` : `<p class="mt-3 flex items-center gap-2 text-sm">${icon('mail', 'icon-sm')} Gift cards are emailed instantly.</p>`}
            <form id="promo-form" class="mt-5" data-feature="Promo codes">
              <label class="label" for="promo">Promo code</label>
              ${o.promo ? `<p class="mt-2 flex items-center justify-between gap-2 rounded-xl bg-juniper-50 p-3 text-sm"><span>${icon('tag', 'icon-sm inline')} <b>${esc(o.promo)}</b> · ${PROMOS[o.promo].label}</span><button type="button" class="link" data-promo-remove>Remove</button></p>`
                : `<div class="mt-2 flex gap-2"><input id="promo" class="input uppercase" name="promo" autocomplete="off" placeholder="Try FALL10" aria-describedby="promo-msg"><button class="btn btn-light shrink-0" type="submit">Apply</button></div>`}
              <p id="promo-msg" class="mt-1 text-sm" aria-live="polite"></p>
            </form>
            <dl class="mt-5 grid gap-2 text-sm">
              <div class="flex justify-between"><dt>Subtotal</dt><dd class="tabular">${money(t.sub)}</dd></div>
              ${t.discount ? `<div class="flex justify-between text-juniper-800"><dt>Discount</dt><dd class="tabular">−${money(t.discount)}</dd></div>` : ''}
              ${t.physical ? `<div class="flex justify-between"><dt>${t.ship === 'pickup' ? 'Pickup' : t.ship === 'delivery' ? 'Local delivery' : 'Shipping'}</dt><dd class="tabular">${t.fee ? money(t.fee) : 'Free'}</dd></div>` : ''}
              <div class="flex justify-between text-basalt-600"><dt>Tax</dt><dd>Calculated at checkout</dd></div>
              <div class="mt-2 flex justify-between border-t border-sand-200 pt-3 text-lg font-semibold"><dt>Total</dt><dd class="tabular">${money(t.total)}</dd></div>
            </dl>
            <button type="button" class="btn btn-primary btn-lg btn-block mt-5" data-checkout data-feature="Stripe hosted checkout">${icon('lock', 'icon-sm')} Check out securely</button>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button type="button" class="btn btn-dark btn-sm" data-checkout >Apple Pay</button>
              <button type="button" class="btn btn-light btn-sm" data-checkout >Google Pay</button>
            </div>
            <ul class="mt-5 grid gap-2 text-sm text-basalt-700">
              <li class="flex gap-2">${icon('shield', 'icon-sm mt-0.5')} 1-year guarantee on every plant</li>
              <li class="flex gap-2">${icon('repeat', 'icon-sm mt-0.5')} 30-day returns on unused goods</li>
            </ul>
          </aside>
        </div>`;
    }

    cRoot.addEventListener('click', async e => {
      const q = e.target.closest('[data-qty]');
      if (q) { const it = cart.items().find(i => i.key === q.dataset.qty); if (it) { if (it.qty + +q.dataset.d < 1) cart.remove(it.key); else cart.setQty(it.key, it.qty + +q.dataset.d); } render(); return; }
      const r = e.target.closest('[data-remove]');
      if (r) { cart.remove(r.dataset.remove); track('remove_from_cart'); toast('Item removed.'); render(); $('#cart-h')?.focus(); return; }
      if (e.target.closest('[data-promo-remove]')) { setOpts({ promo: '' }); return; }
      if (e.target.closest('[data-checkout]')) {
        const items = cart.items(), t = totals(items);
        const lines = items.map(i => ({ label: `${i.name}${i.variant ? ' · ' + i.variant : ''} × ${i.qty}`, amount: i.price * i.qty }));
        if (t.discount) lines.push({ label: `Promo ${opts().promo}`, amount: -t.discount });
        if (t.fee) lines.push({ label: t.ship === 'delivery' ? 'Local delivery' : 'Shipping', amount: t.fee });
        const paid = await stripeDemo({ title: 'Bramble & Basalt order', lines, total: t.total, note: 'Sales tax is added by Stripe on the live checkout page.' });
        if (paid) confirm(items, t);
      }
    });
    cRoot.addEventListener('change', e => { if (e.target.name === 'ship') setOpts({ ship: e.target.value }); });
    cRoot.addEventListener('submit', e => {
      if (e.target.id !== 'promo-form') return;
      e.preventDefault();
      const code = String(new FormData(e.target).get('promo') || '').trim().toUpperCase();
      const msg = $('#promo-msg');
      const items = cart.items(), merch = items.filter(i => i.ship !== 'digital').reduce((s, i) => s + i.price * i.qty, 0);
      if (!PROMOS[code]) { msg.className = 'mt-1 text-sm error-text'; msg.textContent = code ? `“${code}” isn't a valid code.` : 'Enter a code.'; return; }
      if (PROMOS[code].min && merch < PROMOS[code].min) { msg.className = 'mt-1 text-sm error-text'; msg.textContent = `${code} needs ${money(PROMOS[code].min)} of merchandise.`; return; }
      setOpts({ promo: code });
      track('apply_promo', { coupon: code });
      toast(`${icon('tag', 'icon-sm')} ${code} applied`);
    });

    function confirm(items, t) {
      const order = 'BB-' + String(Math.floor(10000 + Math.random() * 89999));
      track('purchase', { transaction_id: order, currency: 'USD', value: t.total, items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })) });
      cart.clear(); store.set(OPTS, {});
      const next = { pickup: 'We’ll text you when it’s ready, usually within 2 hours. Pull into the pickup spots by the café and we’ll bring it out.', delivery: 'We’ll text you a delivery window for tomorrow. Bulk mulch is dumped where you point.', ship: 'You’ll get a tracking link by email within one business day.', none: 'Gift cards are on their way to the recipient’s inbox now.' }[t.ship];
      cRoot.innerHTML = `
        <div class="mx-auto max-w-xl text-center" tabindex="-1" id="order-done" data-feature="Order confirmation">
          <span class="mx-auto grid size-16 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check', 'icon-lg')}</span>
          <h2 class="title-2 mt-5">Thanks! Order ${order} is in.</h2>
          <p class="lead mt-3">${next}</p>
          <div class="card mt-8 p-5 text-left">
            <ul class="divide-y divide-sand-200 text-sm">${items.map(i => `<li class="flex justify-between gap-4 py-2"><span>${esc(i.name)}${i.variant ? ` · ${esc(i.variant)}` : ''} × ${i.qty}</span><span class="tabular">${money(i.price * i.qty)}</span></li>`).join('')}</ul>
            <p class="mt-3 flex justify-between border-t border-sand-200 pt-3 font-semibold"><span>Paid</span><span class="tabular">${money(t.total)} + tax</span></p>
          </div>
          <p class="help mt-4">A receipt was emailed by Stripe. Demo only: no payment was taken.</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3"><a class="btn btn-primary" href="shop.html">Keep shopping</a><a class="btn btn-outline" href="contact.html#track">Track an order</a></div>
        </div>`;
      $('#order-done').focus();
      $('#cart-h').textContent = 'Order confirmed';
    }
    render();
  }

  /* ====================================================== gift cards == */
  const gc = $('#gc-form');
  if (gc) {
    const pv = $('#gc-preview'), img = $('img', pv);
    const custom = $('#gc-custom'), msg = $('#gc-message'), counter = $('#gc-count'), when = $('#gc-when-date');
    const today = new Date(); when.min = today.toISOString().slice(0, 10);
    const amount = () => { const v = new FormData(gc).get('amount'); return v === 'custom' ? Math.round(+custom.value || 0) : +v; };
    const update = () => {
      const d = new FormData(gc);
      const theme = d.get('design');
      pv.dataset.theme = theme; img.src = `assets/img/gc-${theme}.svg`;
      $('#gc-amt').textContent = amount() ? money(amount()).replace('.00', '') : '$—';
      $('#gc-to').textContent = String(d.get('to') || '').trim() || 'Someone special';
      $('#gc-from').textContent = String(d.get('from') || '').trim() || 'You';
      $('#gc-msg').textContent = String(d.get('message') || '').trim() || 'Happy planting!';
      custom.closest('.field').hidden = d.get('amount') !== 'custom';
      custom.required = d.get('amount') === 'custom';
      when.closest('.field').hidden = d.get('delivery') !== 'schedule';
      when.required = d.get('delivery') === 'schedule';
      $('#gc-email-field').hidden = d.get('delivery') === 'print';
      $('#gc-email').required = d.get('delivery') !== 'print';
      counter.textContent = `${msg.value.length}/200`;
    };
    gc.addEventListener('input', update);
    gc.addEventListener('change', update);
    gc.addEventListener('submit', e => {
      e.preventDefault();
      const a = amount();
      if (a < 10 || a > 500) { toast('Choose an amount between $10 and $500.'); custom.focus(); return; }
      const d = new FormData(gc);
      const design = { juniper: 'Juniper', mesa: 'Sunset mesa', wildflower: 'Wildflower' }[d.get('design')];
      const to = String(d.get('to') || '').trim() || 'recipient';
      const deliv = d.get('delivery') === 'print' ? 'print at home' : d.get('delivery') === 'schedule' ? `emails ${new Date(d.get('when') + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'emails now';
      cart.add({ key: 'gc-' + Date.now(), unique: true, id: 'gift-card', name: `Gift card · ${money(a).replace('.00', '')}`, variant: `${design} design · to ${to} · ${deliv}`, price: a, qty: 1, img: 'assets/img/product-gift-card.svg', ship: 'digital', href: 'gift-cards.html' });
    });
    update();

    const bal = $('#gc-balance');
    bal?.addEventListener('submit', e => {
      e.preventDefault();
      const code = String(new FormData(bal).get('code') || '').replace(/\s+/g, '');
      const out = $('#gc-balance-out');
      if (code.length < 8) { out.innerHTML = '<span class="error-text">Card numbers are 16 characters, printed under the barcode.</span>'; return; }
      out.innerHTML = `<b>Balance: $50.00</b> <span class="sample-tag">Sample</span><br><span class="help">Live sites look this up in your point-of-sale (Square, Clover, Shopify POS).</span>`;
      track('gift_card_balance_check');
    });
  }

  /* ================================================== recently viewed == */
  const recent = $('#recent-root');
  if (recent) {
    const ids = store.get('bb-recent', []).filter(byId).slice(0, 4);
    if (ids.length) {
      recent.hidden = false;
      $('[data-recent-grid]', recent).innerHTML = ids.map((id, i) => window.bbCard(byId(id), i)).join('');
      window.BB.paintWish();
    }
  }

  /* ===================================================== saved items == */
  const wish = $('#wish-root');
  if (wish) {
    const shared = new URLSearchParams(location.search).get('items');
    const render = () => {
      const ids = (shared ? shared.split(',') : store.get('bb-wish', [])).filter(byId);
      const intro = $('#wish-intro');
      if (shared) intro.innerHTML = `Someone shared ${ids.length} plant${ids.length === 1 ? '' : 's'} with you. <button type="button" class="link" data-wish-keep>Save them to your list</button>`;
      if (!ids.length) {
        wish.innerHTML = `<div class="py-12 text-center"><p class="title-3">Nothing saved yet.</p><p class="muted mt-2">Tap the heart on any product to keep it here for later.</p><a class="btn btn-primary mt-5" href="shop.html">Browse the garden center</a></div>`;
        $('#wish-actions').hidden = true;
        return;
      }
      $('#wish-actions').hidden = false;
      wish.innerHTML = `<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">${ids.map((id, i) => window.bbCard(byId(id), i)).join('')}</div>`;
      const link = new URL('wishlist.html', location.href); link.searchParams.set('items', ids.join(','));
      $('#wish-share').dataset.copy = link.href;
      window.BB.paintWish();
    };
    document.addEventListener('bb:wish', () => { if (!shared) render(); });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-wish-keep]')) { store.set('bb-wish', [...new Set([...store.get('bb-wish', []), ...shared.split(',').filter(byId)])]); toast('Saved to your list.'); }
      if (e.target.closest('[data-wish-all]')) {
        const ids = (shared ? shared.split(',') : store.get('bb-wish', [])).filter(byId);
        ids.forEach(id => { const p = byId(id); if (p.stock === false) return; const v = p.variants ? p.variants[0] : null; cart.add({ key: p.id + ':0', id: p.id, name: p.name, variant: v ? v[0] : '', price: v ? v[1] : (p.sale ?? p.price), qty: 1, img: `assets/img/product-${p.id}.svg`, ship: p.ship, href: `product.html?p=${p.id}` }, { silent: true }); });
        toast(`${icon('check', 'icon-sm')} Added your saved items to the cart`, { href: 'cart.html', label: 'View cart' });
      }
    });
    render();
  }
})();
