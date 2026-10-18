/* Bramble & Basalt demo: chat assistant. Scripted answers from the site's own info.
   Live builds swap this for a real inbox (HubSpot, Tidio, Crisp) or an AI assistant. */
(() => {
  'use strict';
  const { $, esc, icon, track, ROOT, store } = window.BB;
  const L = p => ROOT + p;

  const KB = [
    { k: ['hour', 'open', 'close', 'today', 'sunday', 'saturday', 'when are'], a: () => `${window.BB.openState ? `Garden center: <b>${window.BB.openState('store').text}</b>. Café: <b>${window.BB.openState('cafe').text}</b>.` : ''} Full hours are on the <a href="${L('contact.html')}">contact page</a>.` },
    { k: ['book', 'appointment', 'estimate', 'visit', 'schedule', 'consult'], a: () => `You can <a href="${L('book.html')}">book a free estimate online</a> in about a minute. Pick a time that suits you and we'll text a reminder.` },
    { k: ['price', 'cost', 'how much', 'expensive', 'rate', 'charge'], a: () => `Every starting price is on our <a href="${L('pricing.html')}">pricing page</a>. For a ballpark on your project, try the <a href="${L('quote.html')}">instant estimate</a>.` },
    { k: ['deliver', 'pickup', 'pick up', 'ship'], a: () => `Online orders are usually ready for pickup in 2 hours. Local delivery is $25, free over $150. Tools and seed ship anywhere in the US.` },
    { k: ['sprinkler', 'blowout', 'irrigation', 'winterize', 'drip'], a: () => `Fall blowouts are $79 for up to 8 zones. <a href="${L('book.html?service=blowout')}">Book a blowout</a>, or read our <a href="${L('blog/sprinkler-blowout-checklist.html')}">blowout checklist</a>.` },
    { k: ['mow', 'lawn', 'plan', 'weekly', 'maintenance'], a: () => `Weekly yard care plans start at $149/month, April to November. <a href="${L('plans.html')}">Compare plans</a>.` },
    { k: ['coffee', 'cafe', 'café', 'latte', 'food', 'menu', 'lunch', 'breakfast'], a: () => `The Potting Shed Café is inside the garden center. <a href="${L('cafe.html')}">See the menu and order ahead</a>.` },
    { k: ['where', 'address', 'direction', 'located', 'location', 'find you'], a: () => `We're at 2210 Basalt Bend Rd, Grand Junction. See <a href="${L('locations.html')}">both locations</a> with directions.` },
    { k: ['financ', 'monthly payment', 'pay over', 'loan', 'afford'], a: () => `Projects over $2,500 can be paid monthly. <a href="${L('financing.html')}">See financing options</a>.` },
    { k: ['job', 'hiring', 'career', 'work for', 'apply'], a: () => `We're hiring crew, irrigation techs and baristas. <a href="${L('careers.html')}">See open roles</a>.` },
    { k: ['gift'], a: () => `Gift cards are emailed instantly and never expire. <a href="${L('gift-cards.html')}">Design one</a>.` },
    { k: ['rent', 'aerator', 'tiller', 'trailer'], a: () => `We rent aerators, tillers, sod cutters and trailers by the day. <a href="${L('rentals.html')}">Check availability</a>.` },
    { k: ['plant', 'native', 'drought', 'what should i'], a: () => `Our <a href="${L('plant-finder.html')}">plant finder</a> suggests plants for your sun, water and space in four questions.` },
    { k: ['human', 'person', 'call', 'talk', 'someone', 'agent', 'phone', 'text'], a: () => `Happy to connect you. <a href="tel:+19705550142" data-loc="chat">Call (970) 555-0142</a>, <a href="sms:+19705550142" data-loc="chat">send a text</a>, or leave your number below and we'll call you back.`, lead: true },
  ];
  const CHIPS = ['Hours today', 'Book an estimate', 'Prices', 'Do you deliver?', 'Talk to a person'];

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chat-launch';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'chat-panel');
  btn.dataset.feature = 'Chat assistant';
  btn.setAttribute('aria-label', 'Questions? Chat with us');
  btn.innerHTML = `${icon('message')} <span class="hidden sm:inline" aria-hidden="true">Questions?</span>`;
  document.body.append(btn);

  let panel = null;
  function build() {
    panel = document.createElement('section');
    panel.id = 'chat-panel';
    panel.className = 'chat-panel';
    panel.setAttribute('aria-label', 'Chat with Bramble & Basalt');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="flex items-center gap-3 border-b border-sand-200 bg-juniper-800 px-4 py-3 text-white">
        <img src="${L('assets/img/logo-mark.svg')}" alt="" width="64" height="64" class="size-9">
        <div class="min-w-0 flex-1"><p class="font-semibold leading-tight">Bramble &amp; Basalt</p><p class="text-xs text-juniper-200">Demo assistant · scripted answers</p></div>
        <button type="button" class="btn-icon text-white hover:bg-white/10" data-chat-close aria-label="Close chat">${icon('x')}</button>
      </div>
      <div class="chat-log" aria-live="polite"></div>
      <div class="border-t border-sand-200 p-3">
        <div class="chat-chips mb-2">${CHIPS.map(c => `<button type="button" data-chip>${c}</button>`).join('')}</div>
        <form class="flex gap-2" data-chat-form>
          <label class="sr-only" for="chat-q">Type a question</label>
          <input id="chat-q" class="input min-h-11 py-2" autocomplete="off" placeholder="Ask about hours, prices, booking…">
          <button class="btn btn-primary btn-sm shrink-0" type="submit" aria-label="Send">${icon('arrow-right', 'icon-sm')}</button>
        </form>
      </div>`;
    document.body.append(panel);
    say(`Hi! I can answer quick questions about hours, prices, booking and the garden center. What can I help with?`);
    panel.addEventListener('click', e => {
      if (e.target.closest('[data-chat-close]')) close();
      const chip = e.target.closest('[data-chip]');
      if (chip) ask(chip.textContent);
    });
    panel.addEventListener('submit', e => {
      e.preventDefault();
      if (e.target.matches('[data-chat-form]')) { const q = $('#chat-q'); if (q.value.trim()) { ask(q.value.trim()); q.value = ''; } }
      if (e.target.matches('[data-chat-lead]')) {
        const d = new FormData(e.target);
        e.target.replaceWith(Object.assign(document.createElement('p'), { className: 'chat-msg chat-bot', innerHTML: `Thanks, ${esc(String(d.get('name')).split(' ')[0])}! Someone will call ${esc(d.get('phone'))} within the hour during business hours.` }));
        track('generate_lead', { form_name: 'chat', lead_source: window.BB.src });
      }
    });
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  function say(html, lead) {
    const log = $('.chat-log', panel);
    log.insertAdjacentHTML('beforeend', `<p class="chat-msg chat-bot">${html}</p>`);
    if (lead) log.insertAdjacentHTML('beforeend', `<form class="chat-msg chat-bot grid gap-2" data-chat-lead><label class="text-sm font-semibold" for="cl-name">Name</label><input id="cl-name" name="name" class="input min-h-10 py-1.5" required autocomplete="name"><label class="text-sm font-semibold" for="cl-phone">Phone</label><input id="cl-phone" name="phone" type="tel" class="input min-h-10 py-1.5" required autocomplete="tel"><button class="btn btn-primary btn-sm" type="submit">Call me back</button></form>`);
    log.scrollTop = log.scrollHeight;
  }
  function ask(q) {
    $('.chat-log', panel).insertAdjacentHTML('beforeend', `<p class="chat-msg chat-me">${esc(q)}</p>`);
    const t = q.toLowerCase();
    const hit = KB.map(x => ({ x, n: x.k.filter(k => t.includes(k)).length })).filter(m => m.n).sort((a, b) => b.n - a.n)[0];
    setTimeout(() => {
      if (hit) say(hit.x.a(), hit.x.lead);
      else say(`I'm a simple demo assistant, so I might have missed that. Try one of the buttons, or <a href="tel:+19705550142" data-loc="chat">call (970) 555-0142</a> and a real person will help.`);
    }, 350);
    track('chat_message', { topic: hit ? hit.x.k[0] : 'unknown' });
  }
  function open() {
    if (!panel) build();
    panel.hidden = false;
    btn.hidden = true;
    btn.setAttribute('aria-expanded', 'true');
    $('#chat-q').focus();
    track('chat_open');
  }
  function close() { panel.hidden = true; btn.hidden = false; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  btn.addEventListener('click', open);
  if (store.get('bb-chat-seen', false) === false) store.set('bb-chat-seen', true);
})();
