/* Bramble & Basalt demo: workshops & events, single-event pages, registration and
   ticketing. Dates are generated relative to today so the demo never shows past events. */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, track, ics, stripeDemo, fmtDate, fmtTime, openDialog, payLink, toStripe, sendLead, sendFailed, toast } = window.BB;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextDow = (dow, ahead) => { const d = new Date(today); d.setDate(d.getDate() + ahead); while (d.getDay() !== dow) d.setDate(d.getDate() + 1); return d; };
  const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
  const CAT = { workshop: ['Workshop', 'chip-juniper'], kids: ['Kids & family', 'chip-sun'], cafe: ['Café', 'chip-clay'] };
  const ADDRESS = '2210 Basalt Bend Rd, Grand Junction, CO 81505';

  const EVENTS = [
    { id: 'bulbs', title: 'Fall bulb planting workshop', cat: 'workshop', start: at(nextDow(6, 1), '10:00'), mins: 90, price: 25, seats: 16, host: 'Sam Whitfield', img: 'scene-beds', desc: 'Plant a pot of tulips, crocus and grape hyacinth to take home, and learn the depth-and-timing rules for bulbs in clay soil. Bulbs, pot and soil included.', bring: ['Gloves if you have them', 'Clothes that can get muddy'] },
    { id: 'pumpkins', title: 'Kids’ pumpkin painting', cat: 'kids', start: at(nextDow(0, 1), '13:00'), mins: 120, price: 0, seats: 30, img: 'scene-meadow', desc: 'Drop in and paint a pumpkin from our patch. Smocks and paint provided. Free; an RSVP helps us pick enough pumpkins.', bring: ['Kids ages 3 and up', 'A camera'] },
    { id: 'winterize', title: 'DIY sprinkler winterizing clinic', cat: 'workshop', start: at(nextDow(3, 4), '18:00'), mins: 60, price: 0, seats: 25, host: 'Luis Herrera', img: 'scene-lawn', desc: 'Luis walks through shutting off, draining and blowing out a home system safely, and when to call a pro instead.', bring: ['A photo of your backflow preventer', 'Questions'] },
    { id: 'swap', title: 'Coffee & cuttings: houseplant swap', cat: 'cafe', start: at(nextDow(6, 8), '09:00'), mins: 90, price: 0, seats: 40, img: 'cafe-hero', desc: 'Bring a cutting, take a cutting. Free drip coffee for everyone who brings a plant to share.', bring: ['Cuttings in a jar or bag', 'A label with the plant name'] },
    { id: 'music', title: 'Live music on the café patio', cat: 'cafe', start: at(nextDow(5, 14), '18:00'), mins: 120, price: 0, seats: 60, img: 'scene-firepit', desc: 'A local acoustic duo by the fire pits. The café stays open late with hot cider and pastries.', bring: ['A blanket', 'Friends'] },
    { id: 'sprouts', title: 'Little sprouts garden club', cat: 'kids', start: at(nextDow(6, 21), '11:00'), mins: 60, price: 5, seats: 15, img: 'scene-beds', desc: 'Ages 4–10 plant a mini succulent garden to take home while grown-ups sip coffee nearby.', bring: ['Nothing, we supply it all'] },
    { id: 'wreath', title: 'Holiday wreath-making class', cat: 'workshop', start: at(nextDow(6, 35), '10:00'), mins: 120, price: 45, seats: 14, host: 'Maya Ortega', img: 'scene-path', desc: 'Build a fresh evergreen wreath with juniper, pine and dried flowers. All materials and a hot drink included.', bring: ['Pruners if you have them', 'Gloves'] },
    { id: 'pruning', title: 'Winter pruning clinic', cat: 'workshop', start: at(nextDow(6, 75), '10:00'), mins: 90, price: 20, seats: 20, img: 'scene-path', desc: 'Hands-on pruning for fruit trees and shrubs in our demonstration orchard. Bring gloves and pruners if you have them.', bring: ['Gloves', 'Pruners'] },
    { id: 'seeds', title: 'Seed starting 101', cat: 'workshop', start: at(nextDow(6, 120), '10:00'), mins: 90, price: 15, seats: 20, img: 'scene-beds', desc: 'Start tomatoes, peppers and flowers indoors for a head start on the Western Slope season. Take home a seed tray.', bring: ['Nothing, we supply it all'] },
  ].sort((a, b) => a.start - b.start);
  const byId = id => EVENTS.find(e => e.id === id);
  const calEvent = e => ({ title: e.title + ' · Bramble & Basalt', start: e.start, minutes: e.mins, location: ADDRESS, details: e.desc });
  const timeRange = e => `${fmtTime(e.start)} – ${fmtTime(new Date(e.start.getTime() + e.mins * 60000))}`;
  const badge = e => `<span class="date-badge" aria-hidden="true"><span>${e.start.toLocaleDateString('en-US', { month: 'short' })}</span><b>${e.start.getDate()}</b></span>`;
  const price = e => e.price ? money(e.price).replace('.00', '') : 'Free';

  /* ------------------------------------------------- home: next three -- */
  const next = $('#events-next');
  if (next) {
    next.innerHTML = EVENTS.slice(0, 3).map(e => `
      <li class="card flex gap-4 p-4">
        ${badge(e)}
        <div class="min-w-0">
          <p class="text-sm text-basalt-600">${fmtDate(e.start, { weekday: 'long' })} · ${fmtTime(e.start)}</p>
          <h3 class="font-sans text-base font-semibold leading-snug"><a class="hover:underline" href="event.html?e=${e.id}">${esc(e.title)}</a></h3>
          <p class="mt-1 text-sm font-semibold text-juniper-800">${price(e)}</p>
        </div>
      </li>`).join('');
  }

  /* --------------------------------------------------- events listing -- */
  const list = $('#events-list');
  if (list) {
    list.innerHTML = EVENTS.map(e => `
      <article id="ev-${e.id}" class="card flex flex-col gap-4 p-5 sm:flex-row" data-tags="${e.cat} ${e.price ? 'paid' : 'free'}">
        ${badge(e)}
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2"><span class="chip ${CAT[e.cat][1]}">${CAT[e.cat][0]}</span><span class="chip chip-outline">${e.price ? price(e) + ' per person' : 'Free'}</span></div>
          <h3 class="title-3 mt-2"><a class="hover:underline" href="event.html?e=${e.id}">${esc(e.title)}</a></h3>
          <p class="mt-1 text-sm font-semibold text-basalt-700"><time datetime="${e.start.toISOString()}">${fmtDate(e.start)}</time> · ${timeRange(e)}</p>
          <p class="muted mt-2">${esc(e.desc)}</p>
          <p class="help mt-2">${e.host ? `Led by ${esc(e.host)} · ` : ''}Up to ${e.seats} guests · At the garden center</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary btn-sm" data-register="${e.id}">${icon('ticket', 'icon-sm')} ${e.price ? 'Get tickets' : 'Reserve a spot'}<span class="sr-only"> for ${esc(e.title)}</span></button>
            <a class="btn btn-light btn-sm" href="event.html?e=${e.id}">Details<span class="sr-only"> about ${esc(e.title)}</span></a>
            <button type="button" class="btn btn-light btn-sm" data-ics="${e.id}">${icon('calendar', 'icon-sm')} Add to calendar<span class="sr-only">: ${esc(e.title)}</span></button>
          </div>
        </div>
      </article>`).join('');
    const hash = location.hash.slice(1);
    if (hash.startsWith('ev-')) document.getElementById(hash)?.scrollIntoView();
  }

  /* ------------------------------------------------ single event page -- */
  const one = $('#event-root');
  if (one) {
    const e = byId(new URLSearchParams(location.search).get('e')) || EVENTS[0];
    document.title = `${e.title} | Bramble & Basalt Garden Co.`;
    one.innerHTML = `
      <section class="relative overflow-hidden bg-basalt-950 on-dark">
        <img src="assets/img/${e.img}.svg" alt="" width="800" height="600" class="absolute inset-0 h-full w-full object-cover opacity-30">
        <div class="container-x relative grid grid-cols-1 gap-8 py-10 md:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <nav aria-label="Breadcrumb" class="text-sm text-basalt-200"><ol class="flex flex-wrap gap-1.5"><li><a class="hover:underline" href="index.html">Home</a></li><li aria-hidden="true">/</li><li><a class="hover:underline" href="events.html">Events</a></li><li aria-hidden="true">/</li><li aria-current="page" class="font-semibold text-white">${esc(e.title)}</li></ol></nav>
            <span class="chip ${CAT[e.cat][1]} mt-6">${CAT[e.cat][0]}</span>
            <h1 class="title-1 mt-3">${esc(e.title)}</h1>
            <p class="lead mt-3"><time datetime="${e.start.toISOString()}">${fmtDate(e.start)}</time> · ${timeRange(e)} · ${price(e)}${e.price ? ' per person' : ''}</p>
            <div class="mt-6 flex flex-wrap gap-3"><button type="button" class="btn btn-accent btn-lg" data-register="${e.id}">${icon('ticket')} ${e.price ? 'Get tickets' : 'Reserve a spot'}</button><button type="button" class="btn btn-ghost-dark btn-lg" data-ics="${e.id}">${icon('calendar')} Add to calendar</button></div>
          </div>
          <div data-feature="Countdown to the real start time">
            <p class="text-sm font-semibold text-sun-300">Starts in</p>
            <div class="countdown mt-2" data-countdown="${e.start.toISOString()}"><div><b data-cd="d">0</b><span>days</span></div><div><b data-cd="h">0</b><span>hours</span></div><div><b data-cd="m">0</b><span>min</span></div><div><b data-cd="s">0</b><span>sec</span></div></div>
          </div>
        </div>
      </section>
      <div class="container-x grid grid-cols-1 gap-10 py-10 md:py-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 class="title-2">About this ${e.cat === 'workshop' ? 'workshop' : 'event'}</h2>
          <p class="lead mt-3">${esc(e.desc)}</p>
          <h3 class="title-3 mt-8">What to bring</h3>
          <ul class="mt-3 grid gap-2">${e.bring.map(b => `<li class="flex gap-2"><span class="text-juniper-700">${icon('check', 'icon-sm mt-1')}</span>${esc(b)}</li>`).join('')}</ul>
          <h3 class="title-3 mt-8">Good to know</h3>
          <ul class="mt-3 grid gap-2 text-basalt-700"><li>Up to ${e.seats} guests, so everyone gets hands-on time.</li><li>Full refund up to 48 hours before, or transfer your spot to a friend.</li><li>Free parking by the café. The patio is step-free.</li></ul>
          <button type="button" class="btn btn-light mt-8" data-share>${icon('share', 'icon-sm')} Share this event</button>
        </div>
        <aside class="grid content-start gap-4">
          <div class="card p-5"><h2 class="title-3">When &amp; where</h2><p class="mt-3 flex gap-2">${icon('calendar', 'icon-sm mt-1')} ${fmtDate(e.start)}<br>${timeRange(e)}</p><p class="mt-2 flex gap-2">${icon('pin', 'icon-sm mt-1')} ${ADDRESS}</p>${e.host ? `<p class="mt-2 flex gap-2">${icon('user', 'icon-sm mt-1')} Led by ${esc(e.host)}</p>` : ''}<a class="link mt-3 inline-block" href="https://www.google.com/maps/search/?api=1&amp;query=Grand+Junction+CO+81505">Get directions</a></div>
          <div class="card p-5"><h2 class="title-3">More coming up</h2><ul class="mt-3 grid gap-3">${EVENTS.filter(x => x !== e).slice(0, 3).map(x => `<li class="flex items-center gap-3">${badge(x)}<a class="font-semibold hover:underline" href="event.html?e=${x.id}">${esc(x.title)}</a></li>`).join('')}</ul></div>
        </aside>
      </div>`;
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.start.toISOString(), endDate: new Date(e.start.getTime() + e.mins * 60000).toISOString(), eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: 'Bramble & Basalt Garden Co.', address: ADDRESS }, description: e.desc, offers: { '@type': 'Offer', price: e.price, priceCurrency: 'USD' } });
    document.head.append(ld);
    window.BB.countdowns?.();
    track('view_event', { event_id: e.id });
  }

  /* ------------------------------------------------------ registration -- */
  const dlg = $('#reg-dialog'), form = $('#reg-form'), done = $('#reg-done');
  if (!dlg) return;
  let cur = null;
  const total = () => cur.price * +$('#reg-qty').value;
  const paintTotal = () => { $('#reg-total').textContent = cur.price ? money(total()) : 'Free'; };
  document.addEventListener('click', ev => {
    const c = ev.target.closest('[data-ics]');
    if (c) { ics(calEvent(byId(c.dataset.ics))); return; }
    const r = ev.target.closest('[data-register]');
    if (!r) return;
    cur = byId(r.dataset.register);
    $('#reg-title').textContent = cur.title;
    $('#reg-when').textContent = `${fmtDate(cur.start)} · ${timeRange(cur)}`;
    $('#reg-submit').textContent = cur.price ? 'Continue to payment' : 'Reserve my spot';
    form.reset(); form.hidden = false; done.hidden = true;
    paintTotal();
    openDialog(dlg, r);
    track('view_event', { event_id: cur.id });
  });
  $('#reg-qty').addEventListener('change', paintTotal);
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const d = new FormData(form), qty = +d.get('qty');
    d.append('event', `${cur.title}, ${fmtDate(cur.start)} ${fmtTime(cur.start)}`);
    const link = cur.price && payLink(`event-${cur.id}`);
    if (!(await sendLead(cur.price ? 'event-tickets' : 'event-rsvp', d))) { sendFailed(form); return; }
    if (link) { track('begin_checkout', { value: total(), currency: 'USD', item_category: 'event', event_id: cur.id }); toStripe(link, { title: cur.title, note: qty > 1 ? `Set the quantity to <b>${qty}</b> on Stripe's page.` : '', email: d.get('email') }); return; }
    if (cur.price) {
      const paid = await stripeDemo({ title: cur.title, lines: [{ label: `${qty} ticket${qty > 1 ? 's' : ''} × ${money(cur.price)}`, amount: total() }], total: total() });
      if (!paid) return;
      if (!dlg.open) dlg.showModal();
    }
    track(cur.price ? 'purchase' : 'event_rsvp', { event_id: cur.id, value: total(), currency: 'USD', quantity: qty });
    form.hidden = true; done.hidden = false;
    done.innerHTML = `
      <span class="grid size-12 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check')}</span>
      <p class="title-3 mt-3" tabindex="-1" id="reg-done-h">See you there, ${esc(String(d.get('name')).trim().split(/\s+/)[0])}!</p>
      <p class="muted mt-2">${qty} spot${qty > 1 ? 's' : ''} for ${esc(cur.title)} on ${fmtDate(cur.start)} at ${fmtTime(cur.start)}. Your ${cur.price ? 'tickets are' : 'confirmation is'} on the way to ${esc(d.get('email'))}.</p>
      <div class="mt-5 flex flex-wrap gap-2"><button type="button" class="btn btn-primary btn-sm" id="reg-ics">${icon('calendar', 'icon-sm')} Add to calendar</button><button type="button" class="btn btn-light btn-sm" data-dialog-close>Done</button></div>`;
    $('#reg-ics').addEventListener('click', () => ics(calEvent(cur)));
    $('#reg-done-h').focus();
  });
})();
