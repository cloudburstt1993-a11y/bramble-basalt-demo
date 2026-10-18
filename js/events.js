/* Bramble & Basalt demo: workshops & events with registration and ticketing.
   Dates are generated relative to today so the demo never shows past events. */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, track, ics, stripeDemo, fmtDate, fmtTime, openDialog } = window.BB;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextDow = (dow, ahead) => { const d = new Date(today); d.setDate(d.getDate() + ahead); while (d.getDay() !== dow) d.setDate(d.getDate() + 1); return d; };
  const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
  const CAT = { workshop: ['Workshop', 'chip-juniper'], kids: ['Kids & family', 'chip-sun'], cafe: ['Café', 'chip-clay'] };
  const ADDRESS = '2210 Basalt Bend Rd, Grand Junction, CO 81505';

  const EVENTS = [
    { id: 'bulbs', title: 'Fall bulb planting workshop', cat: 'workshop', start: at(nextDow(6, 1), '10:00'), mins: 90, price: 25, seats: 16, host: 'Sam Whitfield', desc: 'Plant a pot of tulips, crocus and grape hyacinth to take home, and learn the depth-and-timing rules for bulbs in clay soil. Bulbs, pot and soil included.' },
    { id: 'pumpkins', title: 'Kids’ pumpkin painting', cat: 'kids', start: at(nextDow(0, 1), '13:00'), mins: 120, price: 0, seats: 30, desc: 'Drop in and paint a pumpkin from our patch. Smocks and paint provided. Free; an RSVP helps us pick enough pumpkins.' },
    { id: 'winterize', title: 'DIY sprinkler winterizing clinic', cat: 'workshop', start: at(nextDow(3, 4), '18:00'), mins: 60, price: 0, seats: 25, host: 'Luis Herrera', desc: 'Luis walks through shutting off, draining and blowing out a home system safely, and when to call a pro instead.' },
    { id: 'swap', title: 'Coffee & cuttings: houseplant swap', cat: 'cafe', start: at(nextDow(6, 8), '09:00'), mins: 90, price: 0, seats: 40, desc: 'Bring a cutting, take a cutting. Free drip coffee for everyone who brings a plant to share.' },
    { id: 'music', title: 'Live music on the café patio', cat: 'cafe', start: at(nextDow(5, 14), '18:00'), mins: 120, price: 0, seats: 60, desc: 'A local acoustic duo by the fire pits. The café stays open late with hot cider and pastries.' },
    { id: 'sprouts', title: 'Little sprouts garden club', cat: 'kids', start: at(nextDow(6, 21), '11:00'), mins: 60, price: 5, seats: 15, desc: 'Ages 4–10 plant a mini succulent garden to take home while grown-ups sip coffee nearby.' },
    { id: 'wreath', title: 'Holiday wreath-making class', cat: 'workshop', start: at(nextDow(6, 35), '10:00'), mins: 120, price: 45, seats: 14, host: 'Maya Ortega', desc: 'Build a fresh evergreen wreath with juniper, pine and dried flowers. All materials and a hot drink included.' },
    { id: 'pruning', title: 'Winter pruning clinic', cat: 'workshop', start: at(nextDow(6, 75), '10:00'), mins: 90, price: 20, seats: 20, desc: 'Hands-on pruning for fruit trees and shrubs in our demonstration orchard. Bring gloves and pruners if you have them.' },
    { id: 'seeds', title: 'Seed starting 101', cat: 'workshop', start: at(nextDow(6, 120), '10:00'), mins: 90, price: 15, seats: 20, desc: 'Start tomatoes, peppers and flowers indoors for a head start on the Western Slope season. Take home a seed tray.' },
  ].sort((a, b) => a.start - b.start);
  const byId = id => EVENTS.find(e => e.id === id);
  const calEvent = e => ({ title: e.title + ' · Bramble & Basalt', start: e.start, minutes: e.mins, location: ADDRESS, details: e.desc });
  const timeRange = e => `${fmtTime(e.start)} – ${fmtTime(new Date(e.start.getTime() + e.mins * 60000))}`;
  const badge = e => `<span class="date-badge" aria-hidden="true"><span>${e.start.toLocaleDateString('en-US', { month: 'short' })}</span><b>${e.start.getDate()}</b></span>`;

  /* ------------------------------------------------- home: next three -- */
  const next = $('#events-next');
  if (next) {
    next.innerHTML = EVENTS.slice(0, 3).map(e => `
      <li class="card flex gap-4 p-4">
        ${badge(e)}
        <div class="min-w-0">
          <p class="text-sm text-basalt-600">${fmtDate(e.start, { weekday: 'long' })} · ${fmtTime(e.start)}</p>
          <h3 class="font-sans text-base font-semibold leading-snug"><a class="hover:underline" href="events.html#ev-${e.id}">${esc(e.title)}</a></h3>
          <p class="mt-1 text-sm font-semibold text-juniper-800">${e.price ? money(e.price).replace('.00', '') : 'Free'}</p>
        </div>
      </li>`).join('');
  }

  /* --------------------------------------------------- events listing -- */
  const list = $('#events-list');
  if (!list) return;
  list.innerHTML = EVENTS.map(e => `
    <article id="ev-${e.id}" class="card flex flex-col gap-4 p-5 sm:flex-row" data-tags="${e.cat} ${e.price ? 'paid' : 'free'}">
      ${badge(e)}
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-2"><span class="chip ${CAT[e.cat][1]}">${CAT[e.cat][0]}</span><span class="chip chip-outline">${e.price ? money(e.price).replace('.00', '') + ' per person' : 'Free'}</span></div>
        <h3 class="title-3 mt-2">${esc(e.title)}</h3>
        <p class="mt-1 text-sm font-semibold text-basalt-700"><time datetime="${e.start.toISOString()}">${fmtDate(e.start)}</time> · ${timeRange(e)}</p>
        <p class="muted mt-2">${esc(e.desc)}</p>
        <p class="help mt-2">${e.host ? `Led by ${esc(e.host)} · ` : ''}Up to ${e.seats} guests · At the garden center</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary btn-sm" data-register="${e.id}">${icon('ticket', 'icon-sm')} ${e.price ? 'Get tickets' : 'Reserve a spot'}</button>
          <button type="button" class="btn btn-light btn-sm" data-ics="${e.id}">${icon('calendar', 'icon-sm')} Add to calendar</button>
        </div>
      </div>
    </article>`).join('');

  /* ------------------------------------------------------ registration -- */
  const dlg = $('#reg-dialog'), form = $('#reg-form'), done = $('#reg-done');
  let cur = null;
  const total = () => cur.price * +$('#reg-qty').value;
  const paintTotal = () => { $('#reg-total').textContent = cur.price ? money(total()) : 'Free'; };
  list.addEventListener('click', e => {
    const c = e.target.closest('[data-ics]');
    if (c) { ics(calEvent(byId(c.dataset.ics))); return; }
    const r = e.target.closest('[data-register]');
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
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form), qty = +d.get('qty');
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

  const hash = location.hash.slice(1);
  if (hash.startsWith('ev-')) document.getElementById(hash)?.scrollIntoView();
})();
