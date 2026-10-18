/* Bramble & Basalt demo: find the nearest location by GPS or ZIP code. */
(() => {
  'use strict';
  const { $, $$, esc, track } = window.BB;
  const list = $('#loc-list');
  if (!list) return;
  const ZIP = { 81501: [39.07, -108.56], 81502: [39.07, -108.56], 81503: [39.04, -108.52], 81504: [39.09, -108.49], 81505: [39.11, -108.59], 81506: [39.10, -108.53], 81507: [39.02, -108.62], 81520: [39.08, -108.45], 81521: [39.17, -108.73], 81524: [39.20, -108.81], 81525: [39.24, -108.86], 81526: [39.11, -108.36], 81527: [38.93, -108.42] };
  const miles = ([a, b], [c, d]) => {
    const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    return 3958.8 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  const out = $('#loc-out');
  const rank = (from, label) => {
    const cards = $$('[data-lat]', list).map(c => ({ c, m: miles(from, [+c.dataset.lat, +c.dataset.lng]) })).sort((a, b) => a.m - b.m);
    cards.forEach(({ c, m }, i) => {
      list.append(c);
      $('[data-dist]', c).textContent = `${m.toFixed(1)} miles away`;
      c.classList.toggle('ring-2', i === 0); c.classList.toggle('ring-juniper-700', i === 0);
    });
    out.innerHTML = `Closest to ${esc(label)}: <b>${esc($('h2', cards[0].c).textContent)}</b>, ${cards[0].m.toFixed(1)} miles.`;
    track('find_nearest_location', { method: label === 'you' ? 'gps' : 'zip' });
  };
  $('#loc-gps').addEventListener('click', () => {
    if (!navigator.geolocation) { out.textContent = 'Your browser can’t share location. Try a ZIP code.'; return; }
    out.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(p => rank([p.coords.latitude, p.coords.longitude], 'you'), () => { out.textContent = 'Location is off or blocked. Enter a ZIP code instead.'; $('#loc-zip').focus(); }, { timeout: 8000, maximumAge: 600000 });
  });
  $('#loc-zip-form').addEventListener('submit', e => {
    e.preventDefault();
    const z = $('#loc-zip').value.trim();
    if (ZIP[z]) rank(ZIP[z], z);
    else out.textContent = /^\d{5}$/.test(z) ? `${z} is outside the Grand Valley. Call us and we’ll point you the right way.` : 'Enter a 5-digit ZIP code.';
  });
})();
