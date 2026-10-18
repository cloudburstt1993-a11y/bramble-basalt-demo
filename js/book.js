/* Bramble & Basalt demo: online booking. Live builds embed Cal.com or Calendly;
   this page shows the same flow with availability generated in the browser. */
(() => {
  'use strict';
  const { $, $$, esc, money, icon, toast, track, ics, gcal, fmtDate, fmtTime } = window.BB;
  const root = $('#booking');
  if (!root) return;

  const SERVICES = {
    estimate: { name: 'Free landscape estimate', mins: 60, price: 0, onsite: true, staff: ['maya', 'jordan'] },
    design: { name: 'Design consultation', mins: 90, price: 95, onsite: true, staff: ['maya'], note: 'Credited toward your project' },
    blowout: { name: 'Sprinkler blowout', mins: 30, price: 79, onsite: true, staff: ['luis', 'jordan'] },
    lawn: { name: 'Lawn plan walk-through', mins: 45, price: 0, onsite: true, staff: ['jordan', 'luis'] },
    shop: { name: 'Personal plant shopping', mins: 30, price: 0, onsite: false, staff: ['sam', 'ellie'] },
  };
  const STAFF = { maya: ['Maya Ortega', 'Founder & lead designer'], jordan: ['Jordan Blake', 'Crew lead'], luis: ['Luis Herrera', 'Irrigation lead'], sam: ['Sam Whitfield', 'Garden center manager'], ellie: ['Ellie Chen', 'Customer care'] };
  const ADDRESS = '2210 Basalt Bend Rd, Grand Junction, CO 81505';

  const state = { service: null, staff: 'any', date: null, time: null, month: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
  state.month = new Date(today.getFullYear(), today.getMonth(), 1);

  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const key = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const fullyBooked = d => hash('day' + key(d)) % 9 === 0;
  const closed = d => d.getDay() === 0;

  function slotsFor(d) {
    if (!state.service) return [];
    const s = SERVICES[state.service];
    const sat = d.getDay() === 6;
    const [start, end] = s.onsite ? (sat ? [9, 14] : [8, 16.5]) : (sat ? [9, 17] : [10, 17]);
    const out = [];
    const now = new Date(Date.now() + 2 * 3600e3);
    for (let m = start * 60; m + s.mins <= end * 60; m += 30) {
      const t = new Date(d); t.setHours(0, m, 0, 0);
      if (t < now) continue;
      if (hash(key(d) + m + state.service + state.staff) % 10 < 4) continue;
      out.push(t);
    }
    return out;
  }

  /* ---- step 1: service ---- */
  $$('input[name="service"]', root).forEach(r => r.addEventListener('change', () => {
    state.service = r.value; state.staff = 'any'; state.time = null;
    renderStaff(); renderCal(); renderSlots(); renderSummary();
    $('[name="address"]', root).closest('.field').hidden = !SERVICES[r.value].onsite;
    $('[name="address"]', root).required = SERVICES[r.value].onsite;
  }));

  /* ---- step 2: staff ---- */
  function renderStaff() {
    const box = $('#bk-staff');
    if (!state.service) { box.innerHTML = '<p class="help">Choose a service first.</p>'; return; }
    const ids = SERVICES[state.service].staff;
    const opt = (id, name, role, img) => `<label class="choice items-center"><input type="radio" name="staff" value="${id}" ${state.staff === id ? 'checked' : ''}>${img ? `<img src="assets/img/team-${img}.svg" alt="" width="400" height="400" class="size-11 rounded-full">` : `<span class="grid size-11 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('users')}</span>`}<span><span class="block font-semibold">${name}</span><span class="help">${role}</span></span></label>`;
    box.innerHTML = opt('any', 'First available', 'Fastest way to get on the schedule') + ids.map(id => opt(id, STAFF[id][0], STAFF[id][1], id)).join('');
  }
  $('#bk-staff').addEventListener('change', e => { if (e.target.name === 'staff') { state.staff = e.target.value; state.time = null; renderCal(); renderSlots(); renderSummary(); } });

  /* ---- step 3: calendar + slots ---- */
  const cal = $('#bk-cal'), label = $('#bk-month'), prev = $('#bk-prev'), next = $('#bk-next');
  function renderCal() {
    const m = state.month, y = m.getFullYear(), mo = m.getMonth();
    label.textContent = m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    prev.disabled = y === today.getFullYear() && mo === today.getMonth();
    next.disabled = new Date(y, mo + 1, 1) > maxDate;
    let h = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('');
    for (let i = 0; i < m.getDay(); i++) h += '<span></span>';
    const days = new Date(y, mo + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, mo, d);
      const past = date < today || date > maxDate;
      const why = past ? 'unavailable' : closed(date) ? 'closed Sundays' : (fullyBooked(date) || (state.service && !slotsFor(date).length)) ? 'fully booked' : '';
      if (why && state.date && +state.date === +date) state.date = null;
      const sel = !!(state.date && +state.date === +date);
      h += `<button type="button" class="cal-day ${+date === +today ? 'is-today' : ''}" data-day="${d}" aria-pressed="${sel}" ${why ? 'disabled' : ''} aria-label="${fmtDate(date)}${why ? ', ' + why : ''}">${d}</button>`;
    }
    cal.innerHTML = h;
  }
  prev.addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
  next.addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });
  cal.addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b || b.disabled) return;
    state.date = new Date(state.month.getFullYear(), state.month.getMonth(), +b.dataset.day);
    state.time = null;
    $$('[data-day]', cal).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderSlots(); renderSummary();
    $('#bk-slots-h').focus();
  });

  function renderSlots() {
    const box = $('#bk-slots'), h = $('#bk-slots-h');
    if (!state.date) { h.textContent = 'Pick a date to see open times'; box.innerHTML = ''; return; }
    h.textContent = `Open times on ${fmtDate(state.date)}`;
    if (!state.service) { box.innerHTML = '<p class="help col-span-full">Choose a service to see times.</p>'; return; }
    const slots = slotsFor(state.date);
    box.innerHTML = slots.length
      ? slots.map(t => `<button type="button" class="slot" data-time="${t.getTime()}" aria-pressed="${!!(state.time && +state.time === +t)}">${fmtTime(t)}</button>`).join('')
      : '<p class="help col-span-full">No openings left this day. Try the next one.</p>';
  }
  $('#bk-slots').addEventListener('click', e => {
    const b = e.target.closest('[data-time]');
    if (!b) return;
    state.time = new Date(+b.dataset.time);
    $$('[data-time]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderSummary();
  });

  /* ---- summary ---- */
  function renderSummary() {
    const s = state.service && SERVICES[state.service];
    const row = (ic, k, v) => `<li class="flex gap-3"><span class="mt-0.5 text-juniper-700">${icon(ic, 'icon-sm')}</span><span><span class="block text-xs font-semibold uppercase tracking-wider text-basalt-600">${k}</span>${v}</span></li>`;
    $('#bk-summary').innerHTML = `
      <ul class="grid gap-4 text-sm">
        ${row('leaf', 'Service', s ? `<b>${s.name}</b><br>${s.mins} min · ${s.price ? money(s.price).replace('.00', '') : 'Free'}${s.note ? `<br><span class="help">${s.note}</span>` : ''}` : '<span class="muted">Not chosen yet</span>')}
        ${row('user', 'With', state.staff === 'any' ? 'First available' : STAFF[state.staff][0])}
        ${row('calendar', 'When', state.time ? `<b>${fmtDate(state.time)}</b><br>${fmtTime(state.time)} Mountain time` : state.date ? `${fmtDate(state.date)}<br><span class="muted">Pick a time</span>` : '<span class="muted">Not chosen yet</span>')}
        ${row('pin', 'Where', s ? (s.onsite ? 'At your property' : 'Garden center<br>' + ADDRESS) : '<span class="muted">—</span>')}
      </ul>`;
    $('#bk-submit').setAttribute('aria-disabled', String(!(state.service && state.time)));
  }

  /* ---- step 4: confirm ---- */
  $('#bk-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!state.service) { toast('Choose a service first.'); $('input[name="service"]', root).focus(); return; }
    if (!state.time) { toast('Pick a date and time.'); $('#bk-cal').scrollIntoView({ block: 'center' }); return; }
    const d = new FormData(e.target), s = SERVICES[state.service];
    const first = String(d.get('name') || '').trim().split(/\s+/)[0];
    const event = { title: `${s.name} · Bramble & Basalt`, start: state.time, minutes: s.mins, location: s.onsite ? String(d.get('address') || '') : ADDRESS, details: 'Need to reschedule? Call or text (970) 555-0142.' };
    track('book_appointment', { service: state.service, value: s.price, currency: 'USD' });
    root.hidden = true;
    const done = $('#bk-done');
    done.hidden = false;
    done.innerHTML = `
      <div class="mx-auto max-w-xl text-center">
        <span class="mx-auto grid size-16 place-items-center rounded-full bg-juniper-100 text-juniper-800">${icon('check', 'icon-lg')}</span>
        <h2 class="title-2 mt-5" tabindex="-1" id="bk-done-h">You're booked, ${esc(first || 'friend')}!</h2>
        <p class="lead mt-3">${esc(s.name)} on <b>${fmtDate(state.time)}</b> at <b>${fmtTime(state.time)}</b>${state.staff !== 'any' ? ` with ${STAFF[state.staff][0]}` : ''}.</p>
        <p class="muted mt-2">${d.get('sms') ? 'We’ll text a reminder the day before. ' : ''}A confirmation is on its way to ${esc(d.get('email'))}.</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3" data-feature="Add to calendar">
          <button type="button" class="btn btn-primary" id="bk-ics">${icon('download', 'icon-sm')} Add to calendar (.ics)</button>
          <a class="btn btn-outline" target="_blank" rel="noopener" href="${esc(gcal(event))}">${icon('calendar', 'icon-sm')} Google Calendar</a>
        </div>
        <p class="help mt-6">Need to change it? <a class="link" href="tel:+19705550142">Call</a> or <a class="link" href="sms:+19705550142">text</a> us anytime. Demo: nothing was actually scheduled.</p>
        <button type="button" class="link mt-4" id="bk-again">Book another visit</button>
      </div>`;
    $('#bk-ics').addEventListener('click', () => ics(event));
    $('#bk-again').addEventListener('click', () => location.reload());
    $('#bk-done-h').focus();
    window.scrollTo({ top: done.offsetTop - 120 });
  });

  const pre = new URLSearchParams(location.search).get('service');
  const preInput = pre && $(`input[name="service"][value="${CSS.escape(pre)}"]`, root);
  if (preInput) { preInput.checked = true; preInput.dispatchEvent(new Event('change')); }
  const preStaff = new URLSearchParams(location.search).get('staff');
  if (state.service && preStaff && SERVICES[state.service].staff.includes(preStaff)) state.staff = preStaff;
  renderStaff(); renderCal(); renderSlots(); renderSummary();
})();
